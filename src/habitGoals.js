export const habitGoals = (habit) => [
  { id: 'primary', title: habit.title, days: habit.days },
  ...(habit.goals ?? []),
];

export const toggleGoalDay = (habit, goalId, dateKey) => {
  const toggle = (days) => days.includes(dateKey)
    ? days.filter((day) => day !== dateKey) : [...days, dateKey];
  return goalId === 'primary'
    ? { ...habit, days: toggle(habit.days) }
    : { ...habit, goals: (habit.goals ?? []).map((goal) => goal.id === goalId ? { ...goal, days: toggle(goal.days) } : goal) };
};

export const saveHabitGoal = (habit, goal) => {
  const title = goal.title.trim();
  if (!title) return habit;
  if (goal.id === 'primary') return { ...habit, title };
  const goals = habit.goals ?? [];
  return { ...habit, goals: goals.some((item) => item.id === goal.id)
    ? goals.map((item) => item.id === goal.id ? { ...item, title } : item)
    : [...goals, { id: goal.id, title, days: [] }] };
};
