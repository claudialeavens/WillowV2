import { DISCOVERY_ACTIVITIES, DISCOVERY_PATHS } from './meaningDiscovery.js';
const option = (title, caption, activityId) => ({ title, caption, activityId });
// First follow-up responds to the starting point, not a generic exercise menu.
export const NEED_QUESTIONS = {
  values: { question: 'When you imagine feeling more like yourself, what feels closest?', options: [option('Remembering what has felt fulfilling', 'Find clues in moments that mattered to me', 'values'), option('Hearing my own preferences again', 'Make room for what I want, away from expectations', 'intuition'), option('Feeling useful or connected to something', 'Let something I care about give me a direction', 'contribution')] },
  intuition: { question: 'What feels most in the way of knowing what you want?', options: [option('Other people’s expectations are loud', 'I’d like to hear my own preferences', 'intuition'), option('I don’t know what feels meaningful anymore', 'I’d like a clue from my own life', 'values'), option('There’s too much noise to think clearly', 'I need a little room before deciding', 'stillness')] },
  contribution: { question: 'Where would a little more meaning feel most welcome?', options: [option('In caring for someone or something', 'A small contribution that feels worthwhile', 'contribution'), option('In how I spend an ordinary day', 'More of what feels genuinely fulfilling', 'values'), option('In my relationships', 'A little more contact or shared time', 'reconnect')] },
  reconnect: { question: 'What kind of connection are you missing most?', options: [option('Easy, everyday company', 'Contact without needing a deep conversation', 'reconnect'), option('Someone who really hears me', 'Space to say what’s on my mind', 'support'), option('Sharing something enjoyable', 'A small good moment together', 'savor')] },
  support: { question: 'What would feeling supported look like right now?', options: [option('Being listened to without advice', 'Room for my experience to be heard', 'support'), option('Help with something concrete', 'A small request that would lighten the load', 'agency'), option('Not having to hold everything inside', 'A gentle way to put a feeling into words', 'release')] },
  nourishment: { question: 'What feels closest to the kind of replenishment you need?', options: [option('Basic care has been hard to make space for', 'One nourishing choice that feels manageable', 'nourishment'), option('I’ve been running on pressure', 'A pause before I ask more of myself', 'stillness'), option('My day needs a more workable rhythm', 'One small priority, rather than a whole new routine', 'agency')] },
  movement: { question: 'What would you most like movement to give you?', options: [option('A gentle way to feel less stuck', 'Move a little without pushing myself', 'movement'), option('Something enjoyable to look forward to', 'Start with pleasure, rather than performance', 'savor'), option('A realistic starting point', 'Choose something that fits my energy and day', 'agency')] },
  agency: { question: 'What would make caring for yourself feel more manageable?', options: [option('Knowing what to put first', 'Choose one priority I can influence', 'agency'), option('Having support instead of doing it alone', 'Put one kind of help into words', 'support'), option('Trusting what feels right for me', 'Notice my own needs before making a plan', 'intuition')] },
  stillness: { question: 'What is the quiet you’re looking for more like?', options: [option('Less mental noise for a moment', 'Something steady to bring my attention to', 'stillness'), option('Space for a feeling I’ve been holding', 'Put a little of it down', 'release'), option('Relief from having to work everything out', 'Notice something gently pleasant instead', 'savor')] },
  release: { question: 'What feels closest to what you need to put down?', options: [option('Words or feelings I haven’t expressed', 'Give them a little private space', 'release'), option('The feeling that I must handle it alone', 'Let someone know what would help', 'support'), option('Pressure to sort it all out now', 'A quiet moment before deciding anything', 'stillness')] },
  savor: { question: 'What kind of enjoyment feels most inviting?', options: [option('A small pleasure I can notice right now', 'Something simple, with no need to achieve', 'savor'), option('Rediscovering something I used to love', 'Remember what feels good to me', 'values'), option('Appreciating what’s already supporting me', 'Notice one thing that made today easier', 'gratitude')] },
  gratitude: { question: 'What would you most like to notice more of?', options: [option('The small things that make a day easier', 'Find a little steadiness in what is already here', 'gratitude'), option('People who have been there for me', 'A chance to feel and perhaps share appreciation', 'reconnect'), option('Pleasure I usually rush past', 'Stay with something good for a moment', 'savor')] },
};
const detail = (question, choices) => ({ question, options: choices.map(([title, caption, firstStep]) => ({ title, caption, firstStep })) });
export const FIT_QUESTIONS = {
  values: detail('Which kind of moment would you like to explore?', [
    ['A time I felt quietly fulfilled', 'Find what mattered in an ordinary good moment', 'Recall one ordinary moment when you felt quietly fulfilled. What were you doing, and what mattered in it?'],
    ['Something I used to enjoy', 'Rediscover a part of myself I miss', 'Recall something you used to enjoy. Notice which part of it you miss: creating, learning, company, freedom, or something else.'],
    ['A moment when I felt useful or connected', 'Notice a value I might want more of', 'Recall a moment when you felt useful or connected, without needing anyone’s approval. What made it meaningful to you?'],
  ]),
  intuition: detail('Where would hearing your own preference help most?', [
    ['One small decision', 'Explore a real choice without committing yet', 'Bring one small decision to mind. Set aside what you think you should choose for a moment.'],
    ['What I need more of', 'Notice interest, ease, or a little curiosity', 'Imagine a little more rest, company, creativity, or space in your day. Notice which possibility brings a small sense of ease or interest.'],
    ['What I need less of', 'Start with what feels draining', 'Name one expectation or demand that feels draining. Imagine setting a small part of it down and notice your response.'],
  ]),
  contribution: detail('What would you feel drawn to give a little care to?', [
    ['A person or relationship', 'A gesture that says “you matter”', 'Think of one person you care about and a small gesture that would feel meaningful to you.'],
    ['A creative pursuit', 'Bring an idea into the world, just a little', 'Think of a small creative idea you would enjoy giving a few minutes to, without needing it to be good.'],
    ['A place, cause, or community', 'One manageable contribution', 'Name a place, cause, or community you care about. Consider one tiny contribution that fits your energy.'],
  ]),
  reconnect: detail('What would make reaching out feel easiest?', [
    ['A short message to someone familiar', 'No big conversation required', 'Choose someone familiar who feels safe enough to contact. Draft a simple “You crossed my mind—how are you?” message.'],
    ['Inviting someone to share a small moment', 'A walk, a cup of tea, or a quick call', 'Think of someone you might enjoy a low-pressure shared moment with. Choose a short call, a drink together, or another comfortable invitation.'],
    ['Simply drafting something for now', 'Make room for connection without sending yet', 'Pick someone you might like to reconnect with. Write a few words you could send, knowing you do not need to send them today.'],
  ]),
  support: detail('What kind of request would feel right?', [
    ['“Could you listen for a few minutes?”', 'Be heard without needing a solution', 'Choose someone you trust and draft: “Could you listen for a few minutes? I don’t need advice right now.”'],
    ['“Could you help me with one thing?”', 'Make the practical ask small and specific', 'Name one concrete task that would feel lighter with help, and one person you could ask.'],
    ['“Could we spend a little time together?”', 'Support can simply mean company', 'Think of someone whose company feels supportive. Draft a small invitation to spend time together.'],
  ]),
  nourishment: detail('What would feel most doable today?', [
    ['Make something simple to eat', 'Use familiar foods that fit my needs', 'Think of a simple meal or snack using familiar foods you already have and can comfortably eat.'],
    ['Enjoy a meal without rushing', 'Let nourishment include a little attention', 'Choose an upcoming meal or snack and one way to give it a quieter, less rushed moment.'],
    ['Make the next meal easier', 'A small preparation instead of a big plan', 'Pick one small preparation that would make your next meal easier, such as putting familiar ingredients together.'],
  ]),
  movement: detail('What kind of gentle movement fits you today?', [
    ['A short stroll', 'At a pace that feels comfortable', 'If walking is comfortable for you, choose a short, easy route. Go at your own pace and stop whenever you need.'],
    ['A seated stretch', 'A little movement where I am', 'Choose a comfortable seated position. Gently move or stretch an area that feels okay to move, without forcing a range of motion.'],
    ['Moving to music', 'Let enjoyment lead', 'Put on a little music you like and move any comfortable part of your body, in whatever way feels pleasant.'],
  ]),
  agency: detail('Which small step would help you most?', [
    ['Choose one priority for today', 'Make it small enough to be realistic', 'Name one wellbeing priority for today. Separate what you can influence from what needs help or more time.'],
    ['Prepare a question for someone who can help', 'Get clearer about the support I need', 'Write one question about your wellbeing that you would like to bring to a qualified professional or trusted support person.'],
    ['Make a manageable bit of space', 'Find a moment that could work in my day', 'Look at your day and choose one small, realistic moment you could protect for something supportive.'],
  ]),
  release: detail('How would you prefer to give that feeling some space?', [
    ['Write a few private words', 'No need to make them polished or share them', 'Write a few private lines beginning “What I wish I could say is…” You can stop at any point.'],
    ['Name the feeling gently', 'A word or two can be enough', 'Try naming the feeling in a word or two. If you are unsure, “something feels heavy” is enough.'],
    ['Notice what the feeling is asking for', 'Rest, a boundary, company, or being heard', 'Without needing to explain the feeling, notice whether you want rest, a boundary, company, or simply to be heard.'],
  ]),
  stillness: detail('What feels easiest to rest your attention on?', [
    ['Something I can see', 'A steady or comforting detail nearby', 'Let your gaze rest on a steady or comforting detail nearby. Notice its shape, colour, or light.'],
    ['Something I can feel', 'A familiar point of contact', 'Notice a comfortable point of contact, such as your feet resting or your hands touching a familiar texture.'],
    ['A quiet sound around me', 'Listen without trying to change anything', 'If it feels comfortable, listen for one steady or gentle sound nearby. There is no need to change your breathing or close your eyes.'],
  ]),
  savor: detail('Which small pleasure feels most inviting?', [
    ['Music or a familiar sound', 'Listen for a detail I enjoy', 'Choose a little music or a familiar sound you enjoy. Give one detail your attention for a short while.'],
    ['A view, light, or a bit of nature', 'Notice something pleasant around me', 'Find a view, a patch of light, a plant, or a small natural detail that feels gently pleasant.'],
    ['A comforting everyday moment', 'A warm drink, a texture, or a familiar ritual', 'Choose a comforting everyday moment that suits you, such as holding a drink or touching a familiar texture.'],
  ]),
  gratitude: detail('Where would you like to look for that small support?', [
    ['Something that helped today', 'It does not have to make the whole day good', 'Recall one small thing that made today easier, even if the rest of the day has been difficult.'],
    ['Someone’s kindness', 'Remember a moment when I felt supported', 'Recall a small act of kindness or support, recent or further back, that you would like to appreciate.'],
    ['Something I did for myself', 'Give my own effort a little credit', 'Notice one small thing you did to care for yourself, even if it was imperfect or felt ordinary.'],
  ]),
};
export const discoveryFollowUp = (choice, intentIndex, needIndex = null) => {
  const path = DISCOVERY_PATHS[choice] ?? DISCOVERY_PATHS['Not sure yet'];
  const intent = path.intents[intentIndex];
  if (!intent) return null;
  const first = NEED_QUESTIONS[intent.primary];
  return needIndex === null ? first : FIT_QUESTIONS[first.options[needIndex]?.activityId] ?? null;
};
export const tailoredActivity = (choice, intentIndex, needIndex, fitIndex) => {
  if (needIndex === null || fitIndex === null) return null;
  const first = discoveryFollowUp(choice, intentIndex);
  const need = first?.options[needIndex];
  const fit = need && FIT_QUESTIONS[need.activityId]?.options[fitIndex];
  if (!fit) return null;
  const base = DISCOVERY_ACTIVITIES[need.activityId];
  return { ...base, id: need.activityId, title: fit.title, gain: fit.caption, steps: [fit.firstStep, ...base.steps.slice(1)], fitIndex };
};
