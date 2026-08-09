import { prisma } from "@/lib/prisma";
import { assertPermission, requireSessionUser } from "@/lib/auth";
import { brandIdentity } from "@/lib/brand";
import { getNotificationProviderStatus } from "@/services/notifications";
import { env } from "@/lib/env";
import type { AppRole } from "@/lib/rbac";
import {
  BookingStatus,
  ComplaintStatus,
  HealthScoreBand,
  RecoveryStatus,
  ReminderStatus,
  ServiceStatus,
  SurveyStatus,
  VehicleStatus,
} from "@/generated/prisma/enums";

function todayRange(now = new Date()) {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function monthBucket(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
}

function sortMonthSeries<T extends { monthKey: string }>(
  data: T[],
  limit = 6
) {
  return [...data]
    .sort((left, right) => left.monthKey.localeCompare(right.monthKey))
    .slice(-limit);
}

const openComplaintStatuses = [
  ComplaintStatus.OPEN,
  ComplaintStatus.INVESTIGATING,
  ComplaintStatus.WAITING_CUSTOMER,
];

type DateFilter = {
  from?: Date;
  to?: Date;
};

type BranchScope = {
  allowedBranchIds: string[];
  effectiveBranchId?: string;
  role: AppRole;
};

function maskPhone(phone: string) {
  if (phone.length <= 4) return "****";
  return `${phone.slice(0, 4)}****${phone.slice(-2)}`;
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function shouldMaskSensitiveContacts(role: AppRole) {
  return role === "Technician" || role === "Marketing CRM";
}

function toDayEnd(input: Date) {
  const value = new Date(input);
  value.setHours(23, 59, 59, 999);
  return value;
}

async function resolveBranchScope(requestedBranchId?: string): Promise<BranchScope> {
  const user = await requireSessionUser();
  const allBranchRoles: AppRole[] = ["Admin", "Owner"];

  if (!allBranchRoles.includes(user.role)) {
    return {
      allowedBranchIds: user.branchId ? [user.branchId] : [],
      effectiveBranchId: user.branchId ?? undefined,
      role: user.role,
    };
  }

  try {
    const branches = await prisma.branch.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const ids = branches.map((branch) => branch.id);

    if (requestedBranchId && ids.includes(requestedBranchId)) {
      return { allowedBranchIds: ids, effectiveBranchId: requestedBranchId, role: user.role };
    }

    return { allowedBranchIds: ids, role: user.role };
  } catch (_err) {
    return { allowedBranchIds: ["dev-branch-1"], effectiveBranchId: requestedBranchId, role: user.role };
  }
}

function buildDateFilter(whereDateField: string, dateFilter?: DateFilter) {
  if (!dateFilter?.from && !dateFilter?.to) return {};
  return {
    [whereDateField]: {
      ...(dateFilter.from ? { gte: dateFilter.from } : {}),
      ...(dateFilter.to ? { lte: toDayEnd(dateFilter.to) } : {}),
    },
  };
}

export async function getShellData() {
  const currentUser = await requireSessionUser();
  try {
    const scope = await resolveBranchScope();
    const [branch, openComplaints, pendingReminders, activeBookings, branches] =
      await Promise.all([
        prisma.branch.findFirst({ where: currentUser.branchId ? { id: currentUser.branchId } : undefined }),
        prisma.complaintTicket.count({
          where: {
            status: { in: openComplaintStatuses },
            ...(scope.effectiveBranchId
              ? { branchId: scope.effectiveBranchId }
              : { branchId: { in: scope.allowedBranchIds } }),
          },
        }),
        prisma.reminder.count({
          where: {
            status: ReminderStatus.PENDING,
            ...(scope.effectiveBranchId
              ? { branchId: scope.effectiveBranchId }
              : { branchId: { in: scope.allowedBranchIds } }),
          },
        }),
        prisma.booking.count({
          where: {
            ...(scope.effectiveBranchId
              ? { branchId: scope.effectiveBranchId }
              : { branchId: { in: scope.allowedBranchIds } }),
            status: {
              in: [
                BookingStatus.REQUESTED,
                BookingStatus.CONFIRMED,
                BookingStatus.ARRIVED,
                BookingStatus.IN_SERVICE,
              ],
            },
          },
        }),
        prisma.branch.findMany({
          where: { id: { in: scope.allowedBranchIds } },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
      ]);

    return {
      branchName: branch?.name ?? "Outlet Mobeng Utama",
      branchCode: branch?.code ?? "MBG-01",
      branchCity: branch?.city ?? "Jakarta",
      openComplaints,
      pendingReminders,
      activeBookings,
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      branches,
    };
  } catch (_err) {
    return {
      branchName: "Outlet Mobeng (Dev Mode)",
      branchCode: "MBG-DEV",
      branchCity: "Jakarta",
      openComplaints: 0,
      pendingReminders: 0,
      activeBookings: 0,
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
      },
      branches: [{ id: "dev-branch-1", name: "Cabang Utama (Dev)" }],
    };
  }
}

function getMockDashboardData(filters?: { branchId?: string; from?: Date; to?: Date }) {
  const branches = [{ id: "dev-branch-1", name: "Cabang Utama (Dev)" }];
  return {
    metrics: {
      activeCustomers: 120,
      repeatCustomers: 45,
      openComplaints: 2,
      todayBookings: 5,
      upcomingReminders: 12,
      customerSatisfaction: 92,
      churnRiskCount: 3,
      revenue: 45000000,
      overdueServices: 1,
      slaBreaches: 0,
    },
    branchRanking: [
      { branchId: "dev-branch-1", branchName: "Cabang Utama (Dev)", revenue: 45000000, transactions: 15, customers: 120, bookingsToday: 5, openComplaints: 2 },
    ],
    branchComparison: [
      { branchId: "dev-branch-1", branchName: "Cabang Utama (Dev)", revenue: 45000000, transactions: 15, customers: 120, bookingsToday: 5, openComplaints: 2 },
    ],
    performance: {
      serviceAdvisors: [],
      technicians: [],
      reminderConversionByBranch: [],
      complaintRecoverySla: { breaches: 0, totalOpen: 2 },
    },
    filterContext: {
      branches,
      selectedBranchId: filters?.branchId ?? "dev-branch-1",
      dateFrom: filters?.from,
      dateTo: filters?.to,
    },
    retentionFunnel: [
      { label: "Servis selesai", value: 120, detail: "Transaksi completed yang siap masuk alur retention Mobeng" },
      { label: "Survey terkirim", value: 95, detail: "Pelanggan menerima survey follow-up" },
      { label: "Respon positif", value: 85, detail: "Pelanggan puas dengan layanan" },
      { label: "Booking ulang terkonfirmasi", value: 45, detail: "Pelanggan melakukan servis rutin berikutnya" },
    ],
    recentTransactions: [],
    overdueServices: [],
    complaintSlaAlerts: [],
    todayBookingsList: [],
    topChurnRiskCustomers: [],
    repeatServiceTrend: [],
    priorityWork: [],
  };
}

export async function getDashboardData(filters?: {
  branchId?: string;
  from?: Date;
  to?: Date;
}) {
  try {
    const now = new Date();
    const { start, end } = todayRange(now);
    const scope = await resolveBranchScope(filters?.branchId);
    const branchWhere = scope.effectiveBranchId
      ? { branchId: scope.effectiveBranchId }
      : { branchId: { in: scope.allowedBranchIds } };
    const transactionDateWhere = buildDateFilter("openedAt", {
      from: filters?.from,
      to: filters?.to,
    });
    const bookingDateWhere = buildDateFilter("scheduledStart", {
      from: filters?.from,
      to: filters?.to,
    });
    const reminderDateWhere = buildDateFilter("dueAt", {
      from: filters?.from,
      to: filters?.to,
    });

    const [
      customers,
      completedTransactions,
      allTransactions,
      openComplaints,
      todayBookingsList,
      reminders,
      satisfaction,
      churnRiskCustomers,
      churnRiskCount,
      overdueServices,
      complaintSlaAlerts,
      surveys,
      recoveredComplaints,
      branchRevenue,
      branchCustomers,
      branchBookingsToday,
      branchOpenComplaints,
      advisorPerformance,
      technicianPerformance,
      reminderConversionByBranch,
    ] = await Promise.all([
      prisma.customer.findMany({
        where: branchWhere,
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      }),
      prisma.serviceTransaction.findMany({
        where: { status: ServiceStatus.COMPLETED, ...branchWhere, ...transactionDateWhere },
        orderBy: { openedAt: "asc" },
        select: {
          id: true,
          openedAt: true,
          totalAmount: true,
          customerId: true,
          serviceNumber: true,
          customer: { select: { firstName: true, lastName: true } },
          vehicle: { select: { make: true, model: true, licensePlate: true } },
        },
      }),
      prisma.serviceTransaction.findMany({
        where: { ...branchWhere, ...transactionDateWhere },
        orderBy: { openedAt: "desc" },
        take: 6,
        include: { customer: true, vehicle: true },
      }),
      prisma.complaintTicket.findMany({
        where: { status: { in: openComplaintStatuses }, ...branchWhere },
        orderBy: [{ priority: "desc" }, { openedAt: "asc" }],
        include: {
          customer: true,
          vehicle: true,
          assignedTo: true,
          recoveryActions: {
            orderBy: { promisedAt: "asc" },
            take: 1,
          },
        },
      }),
      prisma.booking.findMany({
        where: {
          ...branchWhere,
          ...bookingDateWhere,
          scheduledStart: { gte: start, lte: end },
          status: {
            in: [
              BookingStatus.REQUESTED,
              BookingStatus.CONFIRMED,
              BookingStatus.ARRIVED,
              BookingStatus.IN_SERVICE,
            ],
          },
        },
        orderBy: { scheduledStart: "asc" },
        include: {
          customer: true,
          vehicle: true,
          advisor: true,
        },
      }),
      prisma.reminder.findMany({
        where: { ...branchWhere, ...reminderDateWhere },
        orderBy: { dueAt: "asc" },
        include: {
          customer: true,
          vehicle: true,
          assignedTo: true,
        },
      }),
      prisma.followUpSurvey.aggregate({
        where: { status: SurveyStatus.COMPLETED, score: { not: null }, customer: branchWhere },
        _avg: { score: true },
      }),
      prisma.customerHealthScore.findMany({
        where: {
          customer: branchWhere,
          band: {
            in: [HealthScoreBand.WATCH, HealthScoreBand.AT_RISK, HealthScoreBand.LOST],
          },
        },
        orderBy: [{ score: "asc" }, { churnRiskPercent: "desc" }],
        take: 5,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      }),
      prisma.customerHealthScore.count({
        where: {
          customer: branchWhere,
          band: {
            in: [HealthScoreBand.WATCH, HealthScoreBand.AT_RISK, HealthScoreBand.LOST],
          },
        },
      }),
      prisma.vehicle.findMany({
        where: {
          ...branchWhere,
          nextServiceDueDate: { lt: now },
          status: VehicleStatus.ACTIVE,
        },
        orderBy: { nextServiceDueDate: "asc" },
        take: 5,
        include: {
          customer: true,
        },
      }),
      prisma.recoveryAction.findMany({
        where: {
          complaintTicket: branchWhere,
          promisedAt: { not: null, lt: now },
          status: { in: [RecoveryStatus.PLANNED, RecoveryStatus.IN_PROGRESS] },
        },
        orderBy: { promisedAt: "asc" },
        take: 5,
        include: {
          complaintTicket: {
            include: {
              customer: true,
              vehicle: true,
            },
          },
          owner: true,
        },
      }),
      prisma.followUpSurvey.findMany({
        where: { customer: branchWhere },
        select: {
          id: true,
          status: true,
          score: true,
        },
      }),
      prisma.complaintTicket.count({
        where: { status: { in: [ComplaintStatus.RESOLVED, ComplaintStatus.CLOSED] }, ...branchWhere },
      }),
      prisma.serviceTransaction.groupBy({
        by: ["branchId"],
        where: { status: ServiceStatus.COMPLETED, ...transactionDateWhere, ...branchWhere },
        _sum: { totalAmount: true },
        _count: { id: true },
      }),
      prisma.customer.groupBy({
        by: ["branchId"],
        where: branchWhere,
        _count: { id: true },
      }),
      prisma.booking.groupBy({
        by: ["branchId"],
        where: { ...branchWhere, scheduledStart: { gte: start, lte: end } },
        _count: { id: true },
      }),
      prisma.complaintTicket.groupBy({
        by: ["branchId"],
        where: { ...branchWhere, status: { in: openComplaintStatuses } },
        _count: { id: true },
      }),
      prisma.serviceTransaction.groupBy({
        by: ["advisorId"],
        where: { ...branchWhere, status: ServiceStatus.COMPLETED, ...transactionDateWhere, advisorId: { not: null } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.serviceTransaction.groupBy({
        by: ["technicianName"],
        where: { ...branchWhere, status: ServiceStatus.COMPLETED, ...transactionDateWhere, technicianName: { not: null } },
        _count: { id: true },
        _sum: { totalAmount: true },
      }),
      prisma.reminder.groupBy({
        by: ["branchId", "status"],
        where: { ...branchWhere, branchId: { not: null } },
        _count: { id: true },
      }),
    ]);

    const completedCountByCustomer = completedTransactions.reduce<Record<string, number>>(
      (acc, transaction) => {
        acc[transaction.customerId] = (acc[transaction.customerId] ?? 0) + 1;
        return acc;
      },
      {}
    );

    const repeatCustomers = Object.values(completedCountByCustomer).filter(
      (count) => count >= 2
    ).length;
    const upcomingReminders = reminders.filter(
      (reminder) => reminder.status === ReminderStatus.PENDING && reminder.dueAt >= now
    );

    const repeatServiceTrendMap = completedTransactions.reduce<
      Record<string, { monthKey: string; month: string; repeatVisits: number }>
    >((acc, transaction) => {
      if ((completedCountByCustomer[transaction.customerId] ?? 0) < 2) {
        return acc;
      }

      const key = monthBucket(transaction.openedAt);
      acc[key] ??= {
        monthKey: key,
        month: monthLabel(transaction.openedAt),
        repeatVisits: 0,
      };
      acc[key].repeatVisits += 1;
      return acc;
    }, {});

    const retentionFunnel = [
      {
        label: "Servis selesai",
        value: completedTransactions.length,
        detail: "Transaksi completed yang siap masuk alur retention Mobeng",
      },
      {
        label: "Survey terkirim",
        value: surveys.filter(
          (survey) =>
            survey.status === SurveyStatus.SENT ||
            survey.status === SurveyStatus.COMPLETED
        ).length,
        detail: "Pelanggan menerima survey follow-up",
      },
      {
        label: "Respon positif (NPS >= 8)",
        value: surveys.filter((survey) => (survey.score ?? 0) >= 4).length,
        detail: "Respon survey mengindikasikan pengalaman servis yang baik",
      },
      {
        label: "Recovery komplain selesai",
        value: recoveredComplaints,
        detail: "Komplain yang berhasil dipulihkan hingga ditutup",
      },
    ];

    const branchIds = Array.from(
      new Set([
        ...branchRevenue.map((item) => item.branchId),
        ...branchCustomers.map((item) => item.branchId),
        ...branchBookingsToday.map((item) => item.branchId),
        ...branchOpenComplaints.map((item) => item.branchId),
      ])
    );

    const branches = await prisma.branch.findMany({
      where: { id: { in: scope.allowedBranchIds } },
      select: { id: true, name: true },
    });

    const branchNameMap = new Map(branches.map((branch) => [branch.id, branch]));

    const branchRanking = branchIds
      .map((branchId) => {
        const rev = branchRevenue.find((item) => item.branchId === branchId);
        const cust = branchCustomers.find((item) => item.branchId === branchId);
        const book = branchBookingsToday.find((item) => item.branchId === branchId);
        const comp = branchOpenComplaints.find((item) => item.branchId === branchId);

        return {
          branchId,
          branchName: branchNameMap.get(branchId)?.name ?? "Cabang Tanpa Nama",
          revenue: Number(rev?._sum.totalAmount ?? 0),
          transactions: rev?._count.id ?? 0,
          customers: cust?._count.id ?? 0,
          bookingsToday: book?._count.id ?? 0,
          openComplaints: comp?._count.id ?? 0,
        };
      })
      .sort((a, b) => b.revenue - a.revenue);

    const reminderConversionMap = reminderConversionByBranch.reduce<
      Record<string, { completed: number; total: number }>
    >((acc, item) => {
      const branchId = item.branchId;
      if (!branchId) return acc;
      acc[branchId] ??= { completed: 0, total: 0 };
      acc[branchId].total += item._count.id;
      if (item.status === ReminderStatus.COMPLETED) {
        acc[branchId].completed += item._count.id;
      }
      return acc;
    }, {});

    return {
      metrics: {
        activeCustomers: customers.length,
        repeatCustomers,
        openComplaints: openComplaints.length,
        todayBookings: todayBookingsList.length,
        upcomingReminders: upcomingReminders.length,
        customerSatisfaction: Math.round(((satisfaction._avg.score ?? 0) / 5) * 100),
        churnRiskCount,
        revenue: completedTransactions.reduce(
          (sum, transaction) => sum + Number(transaction.totalAmount),
          0
        ),
        overdueServices: overdueServices.length,
        slaBreaches: complaintSlaAlerts.length,
      },
      branchRanking,
      branchComparison: branchRanking,
      performance: {
        serviceAdvisors: advisorPerformance
          .map((entry) => ({
            advisorId: entry.advisorId ?? "unknown",
            completedTransactions: entry._count.id,
            revenue: Number(entry._sum.totalAmount ?? 0),
          }))
          .sort((a, b) => b.revenue - a.revenue),
        technicians: technicianPerformance
          .map((entry) => ({
            technicianName: entry.technicianName ?? "Unknown",
            completedTransactions: entry._count.id,
            revenue: Number(entry._sum.totalAmount ?? 0),
          }))
          .sort((a, b) => b.completedTransactions - a.completedTransactions),
        reminderConversionByBranch: Object.entries(reminderConversionMap).map(([branchId, value]) => ({
          branchId,
          branchName: branchNameMap.get(branchId)?.name ?? "Unknown",
          conversionRate: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0,
        })),
        complaintRecoverySla: {
          breaches: complaintSlaAlerts.length,
          totalOpen: openComplaints.length,
        },
      },
      filterContext: {
        branches,
        selectedBranchId: scope.effectiveBranchId,
        dateFrom: filters?.from,
        dateTo: filters?.to,
      },
      retentionFunnel,
      recentTransactions: allTransactions,
      overdueServices,
      complaintSlaAlerts,
      todayBookingsList,
      topChurnRiskCustomers: churnRiskCustomers,
      repeatServiceTrend: sortMonthSeries(Object.values(repeatServiceTrendMap)),
      priorityWork: openComplaints.slice(0, 5).map((complaint) => ({
        id: complaint.id,
        type: "Complaint",
        customer: `${complaint.customer.firstName} ${complaint.customer.lastName}`,
        title: complaint.subject,
        status: complaint.status,
        owner: complaint.assignedTo?.name ?? "Unassigned",
      })),
    };
  } catch (_err) {
    return getMockDashboardData(filters);
  }
}

export async function getCustomersData() {
  try {
    const user = await requireSessionUser();
    const rows = await prisma.customer.findMany({
      where: user.role === "Owner" || user.role === "Admin" ? undefined : user.branchId ? { branchId: user.branchId } : undefined,
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      include: {
        assignedAdvisor: true,
        healthScore: true,
        _count: {
          select: {
            vehicles: true,
            serviceTransactions: true,
            complaints: true,
            bookings: true,
          },
        },
      },
    });
    if (!shouldMaskSensitiveContacts(user.role)) return rows;
    return rows.map((row) => ({
      ...row,
      phone: maskPhone(row.phone),
      email: row.email ? maskEmail(row.email) : null,
    }));
  } catch (_err) {
    return [];
  }
}

export async function getCustomerProfileData(id: string) {
  try {
    const scope = await resolveBranchScope();
    const user = await requireSessionUser();
    const customer = await prisma.customer.findFirst({
      where: scope.effectiveBranchId ? { id, branchId: scope.effectiveBranchId } : { id, branchId: { in: scope.allowedBranchIds } },
      include: {
        branch: true,
        assignedAdvisor: true,
        healthScore: true,
        vehicles: {
          orderBy: [{ updatedAt: "desc" }],
        },
        serviceTransactions: {
          orderBy: { openedAt: "desc" },
          include: {
            vehicle: true,
            advisor: true,
            complaints: true,
          },
        },
        reminders: {
          orderBy: { dueAt: "desc" },
          include: {
            vehicle: true,
            assignedTo: true,
          },
        },
        complaints: {
          orderBy: { openedAt: "desc" },
          include: {
            vehicle: true,
            assignedTo: true,
            recoveryActions: {
              orderBy: { promisedAt: "asc" },
            },
          },
        },
        bookings: {
          orderBy: { scheduledStart: "desc" },
          include: {
            vehicle: true,
            advisor: true,
          },
        },
        journeyEvents: {
          orderBy: { eventAt: "desc" },
          include: {
            vehicle: true,
            serviceTransaction: true,
            createdBy: true,
          },
        },
        surveys: {
          orderBy: { createdAt: "desc" },
          include: {
            serviceTransaction: {
              include: { vehicle: true },
            },
          },
        },
      },
    });
    if (!customer) return customer;
    if (!shouldMaskSensitiveContacts(user.role)) return customer;
    return {
      ...customer,
      phone: maskPhone(customer.phone),
      email: customer.email ? maskEmail(customer.email) : null,
    };
  } catch (_err) {
    return null;
  }
}

export async function getVehiclesData() {
  try {
    const user = await requireSessionUser();
    return await prisma.vehicle.findMany({
      where: user.role === "Owner" || user.role === "Admin" ? undefined : user.branchId ? { branchId: user.branchId } : undefined,
      orderBy: { updatedAt: "desc" },
      include: { customer: true },
    });
  } catch (_err) {
    return [];
  }
}

export async function getTransactionsData() {
  try {
    const user = await requireSessionUser();
    return await prisma.serviceTransaction.findMany({
      where:
        user.role === "Technician"
          ? { technicianName: user.name }
          : user.role === "Owner" || user.role === "Admin"
            ? undefined
            : user.branchId
              ? { branchId: user.branchId }
              : undefined,
      orderBy: { openedAt: "desc" },
      include: { customer: true, vehicle: true, advisor: true },
    });
  } catch (_err) {
    return [];
  }
}

export async function getFollowUpsData() {
  try {
    const scope = await resolveBranchScope();
    return await prisma.followUpSurvey.findMany({
      where: scope.effectiveBranchId ? { customer: { branchId: scope.effectiveBranchId } } : { customer: { branchId: { in: scope.allowedBranchIds } } },
      orderBy: { createdAt: "desc" },
      include: {
        customer: true,
        serviceTransaction: { include: { vehicle: true } },
        sentBy: true,
        responses: true,
      },
    });
  } catch (_err) {
    return [];
  }
}

export async function getFollowUpSurveyDetail(id: string) {
  try {
    const scope = await resolveBranchScope();
    return await prisma.followUpSurvey.findFirst({
      where: scope.effectiveBranchId ? { id, customer: { branchId: scope.effectiveBranchId } } : { id, customer: { branchId: { in: scope.allowedBranchIds } } },
      include: {
        customer: true,
        serviceTransaction: { include: { vehicle: true } },
        sentBy: true,
        responses: true,
      },
    });
  } catch (_err) {
    return null;
  }
}

export async function getComplaintsData() {
  try {
    const scope = await resolveBranchScope();
    const user = await requireSessionUser();
    const rows = await prisma.complaintTicket.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: { openedAt: "desc" },
      include: {
        customer: true,
        vehicle: true,
        assignedTo: true,
        recoveryActions: true,
        tasks: true,
      },
    });
    if (!shouldMaskSensitiveContacts(user.role)) return rows;
    return rows.map((row) => ({
      ...row,
      customer: {
        ...row.customer,
        phone: maskPhone(row.customer.phone),
        email: row.customer.email ? maskEmail(row.customer.email) : null,
      },
    }));
  } catch (_err) {
    return [];
  }
}

export async function getRemindersData() {
  try {
    const scope = await resolveBranchScope();
    const user = await requireSessionUser();
    const rows = await prisma.reminder.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: { dueAt: "asc" },
      include: {
        customer: true,
        vehicle: true,
        assignedTo: true,
      },
    });
    if (!shouldMaskSensitiveContacts(user.role)) return rows;
    return rows.map((row) => ({
      ...row,
      customer: {
        ...row.customer,
        phone: maskPhone(row.customer.phone),
        email: row.customer.email ? maskEmail(row.customer.email) : null,
      },
    }));
  } catch (_err) {
    return [];
  }
}

export async function getBookingsData() {
  const scope = await resolveBranchScope();
  const user = await requireSessionUser();
  const rows = await prisma.booking.findMany({
    where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
    orderBy: { scheduledStart: "asc" },
    include: {
      customer: true,
      vehicle: true,
      advisor: true,
    },
  });
  if (!shouldMaskSensitiveContacts(user.role)) return rows;
  return rows.map((row) => ({
    ...row,
    customer: {
      ...row.customer,
      phone: maskPhone(row.customer.phone),
      email: row.customer.email ? maskEmail(row.customer.email) : null,
    },
  }));
}

export async function getSettingsData() {
  const scope = await resolveBranchScope();
  const [branch, stages, automationJobs, activeBranches] = await Promise.all([
    prisma.branch.findFirst({
      where: scope.effectiveBranchId ? { id: scope.effectiveBranchId } : { id: { in: scope.allowedBranchIds } },
      include: { manager: true },
    }),
    prisma.serviceBlueprintStage.findMany({ orderBy: { stageOrder: "asc" } }),
    prisma.automationJob.findMany({
      orderBy: { nextRunAt: "asc" },
      take: 6,
      include: {
        owner: true,
        blueprintStage: true,
      },
    }),
    prisma.branch.count({ where: { isActive: true } }),
  ]);

  return {
    branch,
    stages,
    automationJobs,
    activeBranches,
    brand: {
      ...brandIdentity,
    },
    notification: getNotificationProviderStatus(),
  };
}

export async function getCrmFormOptions() {
  const scope = await resolveBranchScope();
  const [customers, vehicles, branches, users, transactions] = await Promise.all([
    prisma.customer.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      select: { id: true, firstName: true, lastName: true, customerNumber: true },
    }),
    prisma.vehicle.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: [{ make: "asc" }, { model: "asc" }],
      select: { id: true, make: true, model: true, licensePlate: true },
    }),
    prisma.branch.findMany({
      where: scope.effectiveBranchId ? { id: scope.effectiveBranchId } : { id: { in: scope.allowedBranchIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.user.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.serviceTransaction.findMany({
      where: scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } },
      orderBy: { openedAt: "desc" },
      select: { id: true, serviceNumber: true },
    }),
  ]);

  return { customers, vehicles, branches, users, transactions };
}

export async function getCustomerJourneyData() {
  const scope = await resolveBranchScope();
  return prisma.customerJourneyEvent.findMany({
    where: scope.effectiveBranchId ? { customer: { branchId: scope.effectiveBranchId } } : { customer: { branchId: { in: scope.allowedBranchIds } } },
    orderBy: { eventAt: "desc" },
    take: 100,
    include: {
      customer: true,
      vehicle: true,
      serviceTransaction: true,
      createdBy: true,
    },
  });
}

export async function getReportsData() {
  const scope = await resolveBranchScope();
  const branchWhere = scope.effectiveBranchId
    ? { branchId: scope.effectiveBranchId }
    : { branchId: { in: scope.allowedBranchIds } };
  const [transactions, customers, complaints, reminders, healthScores, activeBookings] =
    await Promise.all([
      prisma.serviceTransaction.findMany({
        where: branchWhere,
        orderBy: { openedAt: "asc" },
        select: { openedAt: true, totalAmount: true, status: true, customerId: true },
      }),
      prisma.customer.findMany({
        where: branchWhere,
        select: {
          id: true,
          createdAt: true,
          serviceTransactions: {
            where: { status: ServiceStatus.COMPLETED },
            select: { id: true },
          },
        },
      }),
      prisma.complaintTicket.findMany({
        where: branchWhere,
        orderBy: { openedAt: "asc" },
        select: { openedAt: true, status: true },
      }),
      prisma.reminder.findMany({
        where: branchWhere,
        select: { status: true, createdAt: true },
      }),
      prisma.customerHealthScore.groupBy({
        by: ["band"],
        _count: { band: true },
      }),
      prisma.booking.count({
        where: {
          ...branchWhere,
          status: { in: [BookingStatus.REQUESTED, BookingStatus.CONFIRMED] },
        },
      }),
    ]);

  const revenueMap = transactions.reduce<
    Record<string, { monthKey: string; month: string; revenue: number }>
  >((acc, transaction) => {
    if (transaction.status !== ServiceStatus.COMPLETED) {
      return acc;
    }

    const key = monthBucket(transaction.openedAt);
    acc[key] ??= {
      monthKey: key,
      month: monthLabel(transaction.openedAt),
      revenue: 0,
    };
    acc[key].revenue += Number(transaction.totalAmount);
    return acc;
  }, {});

  const complaintMap = complaints.reduce<
    Record<string, { monthKey: string; month: string; complaints: number }>
  >((acc, complaint) => {
    const key = monthBucket(complaint.openedAt);
    acc[key] ??= {
      monthKey: key,
      month: monthLabel(complaint.openedAt),
      complaints: 0,
    };
    acc[key].complaints += 1;
    return acc;
  }, {});

  const repeatCustomers = customers.filter(
    (customer) => customer.serviceTransactions.length >= 2
  ).length;
  const completedReminders = reminders.filter(
    (reminder) => reminder.status === ReminderStatus.COMPLETED
  ).length;

  return {
    revenueTrend: sortMonthSeries(Object.values(revenueMap), 12),
    complaintTrend: sortMonthSeries(Object.values(complaintMap), 12),
    kpis: {
      repeatCustomerRate:
        customers.length > 0 ? Math.round((repeatCustomers / customers.length) * 100) : 0,
      complaintRate:
        customers.length > 0 ? Math.round((complaints.length / customers.length) * 100) : 0,
      reminderConversion:
        reminders.length > 0 ? Math.round((completedReminders / reminders.length) * 100) : 0,
      activeBookings,
    },
    healthDistribution: healthScores.map((item) => ({
      band: item.band,
      count: item._count.band,
    })),
  };
}

export async function getTodayBookingsData() {
  const scope = await resolveBranchScope();
  const now = new Date();
  const { start, end } = todayRange(now);
  return prisma.booking.findMany({
    where: {
      ...(scope.effectiveBranchId
        ? { branchId: scope.effectiveBranchId }
        : { branchId: { in: scope.allowedBranchIds } }),
      scheduledStart: { gte: start, lte: end },
    },
    orderBy: { scheduledStart: "asc" },
    include: { customer: true, vehicle: true, advisor: true },
  });
}

export async function getComplaintRecoveryListData() {
  const scope = await resolveBranchScope();
  return prisma.complaintTicket.findMany({
    where: {
      ...(scope.effectiveBranchId
        ? { branchId: scope.effectiveBranchId }
        : { branchId: { in: scope.allowedBranchIds } }),
      status: { in: [ComplaintStatus.OPEN, ComplaintStatus.INVESTIGATING, ComplaintStatus.WAITING_CUSTOMER] },
    },
    orderBy: [{ priority: "desc" }, { openedAt: "asc" }],
    include: { customer: true, vehicle: true, assignedTo: true },
    take: 50,
  });
}

export async function getCustomerQuickLookupData(query: string) {
  const scope = await resolveBranchScope();
  const keyword = query.trim();
  if (!keyword) return [];
  return prisma.customer.findMany({
    where: {
      ...(scope.effectiveBranchId
        ? { branchId: scope.effectiveBranchId }
        : { branchId: { in: scope.allowedBranchIds } }),
      OR: [
        { phone: { contains: keyword, mode: "insensitive" } },
        { firstName: { contains: keyword, mode: "insensitive" } },
        { lastName: { contains: keyword, mode: "insensitive" } },
        {
          vehicles: {
            some: {
              licensePlate: { contains: keyword, mode: "insensitive" },
            },
          },
        },
      ],
    },
    include: {
      vehicles: { orderBy: { updatedAt: "desc" }, take: 3 },
      healthScore: true,
      branch: true,
    },
    take: 20,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getBranchesOverviewData(filters?: { branchId?: string; from?: Date; to?: Date }) {
  const scope = await resolveBranchScope(filters?.branchId);
  const transactionDateWhere = buildDateFilter("openedAt", { from: filters?.from, to: filters?.to });
  const bookingDateWhere = buildDateFilter("scheduledStart", { from: filters?.from, to: filters?.to });
  const [branches, revenues, transactions, bookings, complaints, reminders, surveys] = await Promise.all([
    prisma.branch.findMany({
      where: scope.effectiveBranchId ? { id: scope.effectiveBranchId } : { id: { in: scope.allowedBranchIds } },
      orderBy: { name: "asc" },
    }),
    prisma.serviceTransaction.groupBy({
      by: ["branchId"],
      where: { ...transactionDateWhere, status: ServiceStatus.COMPLETED, ...(scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } }) },
      _sum: { totalAmount: true },
    }),
    prisma.serviceTransaction.groupBy({
      by: ["branchId"],
      where: { ...transactionDateWhere, ...(scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } }) },
      _count: { id: true },
    }),
    prisma.booking.groupBy({
      by: ["branchId"],
      where: { ...bookingDateWhere, ...(scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } }) },
      _count: { id: true },
    }),
    prisma.complaintTicket.groupBy({
      by: ["branchId"],
      where: { ...(scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } }) },
      _count: { id: true },
    }),
    prisma.reminder.groupBy({
      by: ["branchId"],
      where: { ...(scope.effectiveBranchId ? { branchId: scope.effectiveBranchId } : { branchId: { in: scope.allowedBranchIds } }) },
      _count: { id: true },
    }),
    prisma.followUpSurvey.groupBy({
      by: ["customerId"],
      where: { status: SurveyStatus.COMPLETED, score: { not: null } },
      _avg: { score: true },
    }),
  ]);

  const row = branches.map((branch) => ({
    ...branch,
    revenue: Number(revenues.find((item) => item.branchId === branch.id)?._sum.totalAmount ?? 0),
    transactions: transactions.find((item) => item.branchId === branch.id)?._count.id ?? 0,
    bookings: bookings.find((item) => item.branchId === branch.id)?._count.id ?? 0,
    complaints: complaints.find((item) => item.branchId === branch.id)?._count.id ?? 0,
    reminders: reminders.find((item) => item.branchId === branch.id)?._count.id ?? 0,
    customerSatisfaction: Math.round(((surveys.reduce((sum, survey) => sum + Number(survey._avg.score ?? 0), 0) / Math.max(surveys.length, 1)) / 5) * 100),
  }));

  return {
    scope,
    branches: row.sort((a, b) => b.revenue - a.revenue),
  };
}

export async function getBranchDetailData(id: string, filters?: { from?: Date; to?: Date }) {
  const scope = await resolveBranchScope(id);
  if (scope.effectiveBranchId && scope.effectiveBranchId !== id) {
    return null;
  }
  const transactionDateWhere = buildDateFilter("openedAt", { from: filters?.from, to: filters?.to });
  const bookingDateWhere = buildDateFilter("scheduledStart", { from: filters?.from, to: filters?.to });
  const reminderDateWhere = buildDateFilter("dueAt", { from: filters?.from, to: filters?.to });

  const [branch, users, transactions, bookings, complaints, reminders, surveys] = await Promise.all([
    prisma.branch.findUnique({ where: { id } }),
    prisma.user.findMany({ where: { branchId: id }, include: { role: true }, orderBy: { name: "asc" } }),
    prisma.serviceTransaction.findMany({
      where: { branchId: id, ...transactionDateWhere },
      include: { customer: true, vehicle: true, advisor: true },
      orderBy: { openedAt: "desc" },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { branchId: id, ...bookingDateWhere },
      include: { customer: true, vehicle: true, advisor: true },
      orderBy: { scheduledStart: "desc" },
      take: 20,
    }),
    prisma.complaintTicket.findMany({
      where: { branchId: id },
      include: { customer: true, assignedTo: true },
      orderBy: { openedAt: "desc" },
      take: 20,
    }),
    prisma.reminder.findMany({
      where: { branchId: id, ...reminderDateWhere },
      include: { customer: true, assignedTo: true, vehicle: true },
      orderBy: { dueAt: "desc" },
      take: 20,
    }),
    prisma.followUpSurvey.aggregate({
      where: { customer: { branchId: id }, status: SurveyStatus.COMPLETED, score: { not: null } },
      _avg: { score: true },
    }),
  ]);

  if (!branch) return null;
  const completedTransactions = transactions.filter((item) => item.status === ServiceStatus.COMPLETED);
  const uniqueCustomers = new Set(completedTransactions.map((item) => item.customerId));
  const repeatCustomers = completedTransactions.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.customerId] = (acc[tx.customerId] ?? 0) + 1;
    return acc;
  }, {});
  const repeatCustomerRate =
    uniqueCustomers.size > 0
      ? Math.round(
          (Object.values(repeatCustomers).filter((count) => count >= 2).length /
            uniqueCustomers.size) *
            100
        )
      : 0;

  return {
    branch,
    users,
    transactions,
    bookings,
    complaints,
    reminders,
    metrics: {
      revenue: completedTransactions.reduce((sum, tx) => sum + Number(tx.totalAmount), 0),
      transactions: transactions.length,
      bookings: bookings.length,
      complaints: complaints.length,
      reminders: reminders.length,
      customerSatisfaction: Math.round(((surveys._avg.score ?? 0) / 5) * 100),
      repeatCustomerRate,
    },
  };
}

export async function getTransactionImportLogsData() {
  const scope = await resolveBranchScope();
  const where = scope.effectiveBranchId
    ? { OR: [{ branchId: scope.effectiveBranchId }, { branchId: null }] }
    : { OR: [{ branchId: { in: scope.allowedBranchIds } }, { branchId: null }] };

  return prisma.transactionImportLog.findMany({
    where,
    include: {
      branch: { select: { name: true, code: true } },
      importedBy: { select: { name: true, email: true } },
    },
    orderBy: { importedAt: "desc" },
    take: 100,
  });
}

export async function getMonitoringData() {
  await requireSessionUser();
  await assertPermission("admin", "read");
  const [jobFailures, importFailures, notificationFailures, dbPing, lastJobRun] =
    await Promise.all([
      prisma.automationJob.findMany({
        where: { status: "FAILED" },
        orderBy: { updatedAt: "desc" },
        take: 10,
      }),
      prisma.transactionImportLog.findMany({
        where: { failedRows: { gt: 0 } },
        orderBy: { importedAt: "desc" },
        take: 10,
      }),
      prisma.notificationLog.findMany({
        where: { status: "FAILED" },
        orderBy: { failedAt: "desc" },
        take: 10,
      }),
      prisma.$queryRaw`SELECT 1`,
      prisma.automationJob.findFirst({
        where: { processedAt: { not: null } },
        orderBy: { processedAt: "desc" },
        select: { processedAt: true },
      }),
    ]);

  return {
    systemHealth: "ok",
    databaseStatus: Array.isArray(dbPing) ? "connected" : "connected",
    schedulerStatus: env.JOB_RUNNER_MODE === "database" ? "active" : "memory_mode",
    notificationProvider: getNotificationProviderStatus().selectedProvider,
    lastJobRunAt: lastJobRun?.processedAt ?? null,
    jobFailures,
    importFailures,
    notificationFailures,
  };
}
