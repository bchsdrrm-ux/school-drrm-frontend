// General safety guidance shown on the public page. This is instructional copy,
// not school data: edit freely, and keep it aligned with the school's own DRRM
// plan and the instructions given during drills.

export const NATIONAL_HOTLINES = [
  { name: 'National Emergency Hotline', number: '911', note: 'Police, fire and medical emergencies' },
  { name: 'Philippine Red Cross', number: '143', note: 'Emergency and disaster assistance' },
];

export const GUIDES = [
  {
    id: 'earthquake',
    title: 'Earthquake',
    summary: 'Drop, Cover, and Hold On.',
    sections: [
      {
        heading: 'During shaking',
        steps: [
          'DROP to your hands and knees, COVER your head and neck under a sturdy desk or table, and HOLD ON until the shaking stops.',
          'If there is no table, crouch next to an inside wall and cover your head and neck with your arms.',
          'Stay away from windows, glass, shelves and anything that can fall.',
          'Do not run outside while the ground is shaking.',
          'If you are outdoors, move to an open area away from buildings, posts, wires and trees.',
        ],
      },
      {
        heading: 'After shaking stops',
        steps: [
          'Stay calm and follow your teacher or the DRRM team. Leave the building by your assigned route.',
          'Use the stairs, never the elevator, and watch for falling debris and broken glass.',
          'Expect aftershocks: drop, cover and hold on again if they happen.',
          'Go to the assembly area and wait for the headcount. Do not go back inside until it is declared safe.',
        ],
      },
    ],
  },
  {
    id: 'fire',
    title: 'Fire',
    summary: 'Alert, get out, stay out.',
    sections: [
      {
        heading: 'If you see or smell fire',
        steps: [
          'Shout to alert others and activate the nearest fire alarm.',
          'Leave immediately by the nearest safe exit. Do not stop for belongings.',
          'Stay low if there is smoke. Feel a closed door with the back of your hand first; if it is hot, do not open it.',
          'Close doors behind you to slow the spread of fire and smoke. Do not lock them.',
          'Never use the elevator.',
          'If your clothes catch fire: stop, drop and roll.',
        ],
      },
      {
        heading: 'Outside',
        steps: [
          'Go to the assembly area and stay with your class for the headcount.',
          'Call 911 or the Bureau of Fire Protection if help has not been called.',
          'Do not re-enter the building until the authorities say it is safe.',
        ],
      },
    ],
  },
  {
    id: 'typhoon-flood',
    title: 'Typhoon or flood',
    summary: 'Stay informed, stay out of floodwater.',
    sections: [
      {
        heading: 'Before and during',
        steps: [
          'Follow official weather advisories (PAGASA) and your school\'s class suspension announcements.',
          'Stay indoors, away from windows and glass doors, during strong winds.',
          'Never wade or drive through floodwater: it can be deeper, faster and more dangerous than it looks, and may be electrified.',
          'Stay away from rivers, creeks, slopes and areas at risk of landslides.',
        ],
      },
      {
        heading: 'After',
        steps: [
          'Wait for the all-clear before leaving or returning to school.',
          'Report damaged buildings, fallen wires or blocked paths to a teacher or the DRRM team, and keep away from them.',
        ],
      },
    ],
  },
  {
    id: 'lockdown',
    title: 'Lockdown (security threat)',
    summary: 'Lock, hide, stay quiet.',
    sections: [
      {
        heading: 'When a lockdown is announced',
        steps: [
          'Move away from doors and windows. Lock or barricade the door if you can.',
          'Turn off lights and put phones on silent. Stay low, quiet and out of sight.',
          'Do not open the door for anyone until an official all-clear is given by school authorities.',
          'Follow your teacher\'s instructions. Call 911 if it is safe to do so and someone is in immediate danger.',
        ],
      },
    ],
  },
  {
    id: 'evacuation',
    title: 'Any evacuation',
    summary: 'Calm, together, accounted for.',
    sections: [
      {
        heading: 'How to evacuate',
        steps: [
          'Walk. Do not run, push or crowd the exits.',
          'Leave belongings behind unless told otherwise.',
          'Follow the route assigned to your room and go to the assembly area with your class.',
          'Stay with your teacher. Every class is counted, and nobody leaves before being accounted for.',
          'Tell a teacher right away if someone is missing or hurt.',
        ],
      },
    ],
  },
];

export const PARENT_GUIDE = {
  title: 'For parents and guardians',
  steps: [
    'Please do not rush to the school. Crowds and traffic can block emergency vehicles and evacuation routes.',
    'Wait for official announcements from the school. Keep your phone line free for messages.',
    'Learners are released only through the school\'s designated pick-up process, once it is safe.',
    'Make sure the school has your current contact number and a trusted alternate.',
  ],
};
