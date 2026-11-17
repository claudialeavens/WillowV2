const APPROACHES = {
  'Clear my mind': 'Invite them to put down whatever is on their mind, in any order. Reflect it back in a few manageable groups before asking what needs attention. Do not demand a complete list.',
  'Get organized': 'Ask what needs doing. Help group tasks, distinguish appointments and deadlines from flexible tasks, and turn vague tasks into manageable actions. Confirm priorities with them.',
  'Decide what to tackle first': 'Ask about the competing demands. Consider real deadlines, consequences, available energy, and what would bring relief. Help them choose one realistic next action without imposing priorities.',
  'Get started': 'Ask what they are putting off and what makes starting difficult. Help make the first step small and concrete, perhaps a two-minute action. Offer gentle company and invite a check-in without pressure.',
  'Stay focused': 'Ask what they want to work on and help choose a small outcome and a realistic focus interval. Help set aside distractions and invite them to return when ready. Never claim to run a timer, monitor their work, or send reminders.',
};

export function managingLifeInstructions(context) {
  if (context?.activity !== 'Managing life') return '';
  return `MANAGING LIFE: Provide guided practical support to move from mental clutter, overwhelm, or procrastination into manageable action, or help the person stay focused. Keep the conversation practical, warm, and free of judgment. Ask one short question at a time and adapt to their energy. Avoid turning every task into emotional exploration or presenting a long to-do list. Do not claim to access inboxes, book appointments, or take external actions. Selected need: ${context.selection}. ${APPROACHES[context.selection] ?? ''}`;
}
