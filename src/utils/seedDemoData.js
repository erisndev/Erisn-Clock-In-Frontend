// Demo data seeder - call this on app initialization

export function seedDemoData(forceReseed = false) {
  // Check if demo data already exists
  const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
  const hasGraduates = existingUsers.some(u => u.role === "graduate");
  
  // Only skip if we have graduates AND not forcing reseed
  if (hasGraduates && !forceReseed) {
    console.log("Demo data already exists, skipping seed.");
    return;
  }

  console.log("Seeding demo data...");

  // Demo Users
  const users = [
    { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "graduate" },
    { id: 2, name: "Bob Smith", email: "bob@example.com", role: "graduate" },
    { id: 3, name: "Carol Lee", email: "carol@example.com", role: "graduate" },
    { id: 4, name: "David Chen", email: "david@example.com", role: "graduate" },
    { id: 5, name: "Emma Wilson", email: "emma@example.com", role: "graduate" },
    { id: 100, name: "Admin User", email: "admin@example.com", role: "admin" },
  ];

  // Generate timesheet entries for each graduate
  const timesheet = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  users.filter(u => u.role === "graduate").forEach((user) => {
    // Generate entries for the past 20 working days
    let daysGenerated = 0;
    let dayOffset = 1;

    while (daysGenerated < 15) {
      const date = new Date(currentYear, currentMonth, now.getDate() - dayOffset);
      dayOffset++;

      // Skip weekends
      if (date.getDay() === 0 || date.getDay() === 6) continue;

      // Random chance of being absent (10%)
      if (Math.random() < 0.1) {
        daysGenerated++;
        continue;
      }

      const clockInHour = 8 + Math.floor(Math.random() * 2); // 8-9 AM
      const clockInMinute = Math.floor(Math.random() * 60);
      const clockIn = new Date(date);
      clockIn.setHours(clockInHour, clockInMinute, 0, 0);

      const hoursWorked = 7 + Math.random() * 2; // 7-9 hours
      const clockOut = new Date(clockIn.getTime() + hoursWorked * 3600000);

      const notes = [
        "Working on project tasks",
        "Team meeting and code review",
        "Documentation and testing",
        "Feature development",
        "Bug fixes and improvements",
        "",
        "",
        "",
      ];

      timesheet.push({
        id: Date.now() + Math.random() * 100000,
        date: date.toISOString(),
        clockIn: clockIn.getTime(),
        clockOut: clockOut.getTime(),
        note: notes[Math.floor(Math.random() * notes.length)],
        userId: user.id,
        userName: user.name,
      });

      daysGenerated++;
    }
  });

  // Generate reports for each graduate
  const reports = [];
  const summaries = [
    "Completed onboarding tasks and started working on the main project. Attended team meetings and collaborated with senior developers.",
    "Focused on learning the codebase and implementing small features. Made good progress on understanding the architecture.",
    "Worked on bug fixes and improvements. Participated in sprint planning and daily standups.",
    "Developed new features for the dashboard module. Received positive feedback from the team lead.",
    "Completed assigned tasks ahead of schedule. Started working on documentation for the API endpoints.",
  ];

  const challengesList = [
    "Understanding the complex codebase structure took longer than expected.",
    "Debugging production issues required learning new debugging tools.",
    "Balancing multiple tasks while maintaining code quality was challenging.",
    "Coordinating with remote team members across different time zones.",
    "",
  ];

  const learningsList = [
    "Learned advanced React patterns and state management techniques.",
    "Gained experience with CI/CD pipelines and deployment processes.",
    "Improved understanding of database optimization and query performance.",
    "Developed better communication skills through code reviews.",
    "Learned to write more maintainable and testable code.",
  ];

  const nextWeekPlans = [
    "Focus on completing the user authentication module and writing comprehensive tests.",
    "Start working on the reporting dashboard and integrate with the analytics API.",
    "Refactor legacy code and improve documentation for the team.",
    "Implement new features based on user feedback and conduct code reviews.",
    "",
  ];

  const goalsList = [
    "Become proficient in the team's tech stack and contribute to major features.",
    "Improve code review skills and mentor junior developers.",
    "Complete certification in cloud architecture.",
    "Lead a small project from planning to deployment.",
    "",
  ];

  users.filter(u => u.role === "graduate").forEach((user, userIndex) => {
    // Generate 2-3 reports per user
    const numReports = 2 + Math.floor(Math.random() * 2);

    for (let i = 0; i < numReports; i++) {
      const weeksAgo = i + 1;
      const endDate = new Date(now.getTime() - (weeksAgo - 1) * 7 * 24 * 3600000);
      const startDate = new Date(endDate.getTime() - 7 * 24 * 3600000);

      const statuses = ["approved", "approved", "pending", "rejected"];
      const status = i === 0 ? "pending" : statuses[Math.floor(Math.random() * statuses.length)];

      const report = {
        id: Date.now() + userIndex * 1000 + i + Math.random() * 1000,
        weekStart: startDate.toISOString().split("T")[0],
        weekEnd: endDate.toISOString().split("T")[0],
        summary: summaries[(userIndex + i) % summaries.length],
        challenges: challengesList[(userIndex + i) % challengesList.length],
        learnings: learningsList[(userIndex + i) % learningsList.length],
        nextWeek: nextWeekPlans[(userIndex + i) % nextWeekPlans.length],
        goals: goalsList[(userIndex + i) % goalsList.length],
        status,
        submittedAt: new Date(endDate.getTime() + 24 * 3600000).toISOString(),
        userId: user.id,
        userName: user.name,
      };

      if (status === "approved") {
        report.adminComment = "Great work! Keep up the excellent progress.";
      } else if (status === "rejected") {
        report.adminComment = "Please provide more details about your tasks and accomplishments.";
      }

      reports.push(report);
    }
  });

  // Save to localStorage
  localStorage.setItem("users", JSON.stringify(users));
  localStorage.setItem("timesheet", JSON.stringify(timesheet));
  localStorage.setItem("reports", JSON.stringify(reports));

  console.log("✅ Demo data seeded successfully!");
  console.log(`   - ${users.length} users (${users.filter(u => u.role === 'graduate').length} graduates)`);
  console.log(`   - ${timesheet.length} timesheet entries`);
  console.log(`   - ${reports.length} reports`);
}

export function clearAllData() {
  localStorage.removeItem("users");
  localStorage.removeItem("timesheet");
  localStorage.removeItem("reports");
  localStorage.removeItem("currentUser");
  localStorage.removeItem("clockStatus");
  localStorage.removeItem("clockStartTime");
  console.log("✅ All data cleared!");
}

export function resetDemoData() {
  clearAllData();
  seedDemoData(true);
}

// Make functions available globally for easy console access
if (typeof window !== 'undefined') {
  window.seedDemoData = seedDemoData;
  window.clearAllData = clearAllData;
  window.resetDemoData = resetDemoData;
}
