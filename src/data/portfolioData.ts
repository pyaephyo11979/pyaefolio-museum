export interface ProjectCaseStudy {
  problem: string;
  keyFeatures: string[];
  engineering: string;
}

export interface ProjectExhibit {
  id: string;
  number: string;
  title: string;
  category: 'Full Stack' | 'Backend' | 'Mobile' | 'Frontend';
  shortDesc: string;
  techStack: string[];
  imageUrl?: string;
  liveDemoUrl?: string;
  sourceCodeUrl: string;
  docsUrl?: string;
  accentColor: string;
  secondaryColor: string;
  dioramaType:
    | 'careerhub'
    | 'openpath-api'
    | 'openpath-mobile'
    | 'careercraft'
    | 'weather'
    | 'readers-choice'
    | 'travel-relax'
    | 'voting-system';
  position: { x: number; z: number; rotationY: number };
  caseStudy: ProjectCaseStudy;
}

export interface SkillPillar {
  id: string;
  category: string;
  subtitle: string;
  color: string;
  iconSymbol: string;
  skills: string[];
  position: { x: number; z: number };
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  type: 'Work Experience' | 'Education';
  logoUrl?: string;
  website?: string;
  summary: string;
  highlights: string[];
  color: string;
  position: { x: number; z: number; rotationY: number };
}

export type ChassisType = 'humanoid' | 'hover-bot';
export type HeadwearType = 'none' | 'slick-hair' | 'beret' | 'crown' | 'antenna' | 'headphones';
export type EyewearType = 'none' | 'glasses' | 'cyber-visor' | 'sunglasses';
export type BackwearType = 'none' | 'tech-pack' | 'cape' | 'scarf' | 'wings';
export type CompanionType = 'none' | 'mini-drone' | 'holo-cube';

export interface CharacterCustomizationConfig {
  presetId: 'recruiter' | 'techlead' | 'robot' | 'designer' | 'custom';
  displayName: string;
  badgeText: string;
  chassis: ChassisType;
  headwear: HeadwearType;
  eyewear: EyewearType;
  backwear: BackwearType;
  companion: CompanionType;
  primaryColor: string;
  secondaryColor: string;
  skinOrChassisColor: string;
  speedMultiplier: number;
}

export interface VisitorCharacterType {
  id: 'recruiter' | 'techlead' | 'robot' | 'designer';
  name: string;
  roleTitle: string;
  badgeText: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  skinOrChassisColor: string;
  speedMultiplier: number;
  defaultConfig: CharacterCustomizationConfig;
}

export const CUSTOMIZATION_SWATCHES = {
  primaryColors: [
    '#0066FF',
    '#7C3AED',
    '#06B6D4',
    '#10B981',
    '#F59E0B',
    '#EC4899',
    '#EF4444',
    '#1E293B'
  ],
  secondaryColors: [
    '#38BDF8',
    '#C084FC',
    '#22D3EE',
    '#34D399',
    '#FBBF24',
    '#F472B6',
    '#FB7185',
    '#A5B4FC'
  ],
  skinAndChassisTones: [
    { label: 'Warm Ivory', hex: '#F6C9A8' },
    { label: 'Golden Honey', hex: '#E5B088' },
    { label: 'Rich Amber', hex: '#C6865A' },
    { label: 'Deep Espresso', hex: '#7A4B32' },
    { label: 'Titanium Alloy', hex: '#E2E8F0' },
    { label: 'Cyber Obsidian', hex: '#334155' },
    { label: 'Solar Gold', hex: '#FDE047' },
    { label: 'Neon Mint', hex: '#6EE7B7' }
  ],
  badgePresets: [
    'VIP RECRUITER',
    'TECH LEAD',
    'FULL STACK DEV',
    'UI/UX CRITIC',
    'CURATOR BOT',
    'GUEST EXPLORER'
  ]
};

export const PROFILE_DATA = {
  fullName: 'Pyae Phyo Hlaing',
  brandName: 'PyaeFolio',
  title: 'Junior Full Stack Developer',
  location: 'Yangon, Myanmar',
  avatarUrl: '/assets/Profile.jpg',
  domains: ['Web', 'Backend', 'Mobile'],
  heroTagline:
    'I build web and mobile applications with React, Node.js, Express, MongoDB and Flutter — from backend APIs to user-facing experiences.',
  aboutBio:
    "I'm a Computer Science student building full-stack web and mobile applications, with a focus on React, Node.js and Flutter. Alongside my studies, I've developed personal projects and gained internship experience at Tech Breeze Limited and Brainwave Data. My work spans backend services, database design and application development.",
  educationSummary:
    'Bachelor of Computing in Computer Science (2019–2027), University of Computer Studies, Sittwe & Pathein',
  contact: {
    email: 'pyarephyoehlaing16@gmail.com',
    phone: '+95 9757524978',
    location: 'Yangon, Myanmar',
    portfolioUrl: 'https://pyaefolio.netlify.app',
    github: 'https://github.com/pyaephyo11979',
    linkedin: 'https://www.linkedin.com/in/pyareph',
    twitter: 'https://x.com/pyaephyo20003?s=21',
    instagram: 'https://www.instagram.com/pyae_p_h',
    resumeDownload:
      'https://drive.google.com/uc?export=download&id=1FyIwB03rEXa1Xejk5I1QOScLv3aFPegh',
    resumeView:
      'https://drive.google.com/file/d/1FyIwB03rEXa1Xejk5I1QOScLv3aFPegh/view?usp=share_link'
  }
};

export const VISITOR_CHARACTERS: VisitorCharacterType[] = [
  {
    id: 'recruiter',
    name: 'Alex Mercer',
    roleTitle: 'Talent Partner & Tech Recruiter',
    badgeText: 'VIP RECRUITER',
    tagline: 'Scouting full-stack talent, clean architecture, and production-ready impact.',
    primaryColor: '#0066FF',
    secondaryColor: '#38BDF8',
    skinOrChassisColor: '#F6C9A8',
    speedMultiplier: 1.08,
    defaultConfig: {
      presetId: 'recruiter',
      displayName: 'Alex (VIP Recruiter)',
      badgeText: 'VIP RECRUITER',
      chassis: 'humanoid',
      headwear: 'slick-hair',
      eyewear: 'glasses',
      backwear: 'none',
      companion: 'none',
      primaryColor: '#0066FF',
      secondaryColor: '#38BDF8',
      skinOrChassisColor: '#F6C9A8',
      speedMultiplier: 1.08
    }
  },
  {
    id: 'techlead',
    name: 'Maya Lin',
    roleTitle: 'Staff Systems Architect',
    badgeText: 'TECH LEAD',
    tagline: 'Inspecting API security, database schemas, JWT flows, and state layers.',
    primaryColor: '#7C3AED',
    secondaryColor: '#C084FC',
    skinOrChassisColor: '#E5B088',
    speedMultiplier: 1.08,
    defaultConfig: {
      presetId: 'techlead',
      displayName: 'Maya (Tech Lead)',
      badgeText: 'TECH LEAD',
      chassis: 'humanoid',
      headwear: 'headphones',
      eyewear: 'cyber-visor',
      backwear: 'tech-pack',
      companion: 'holo-cube',
      primaryColor: '#7C3AED',
      secondaryColor: '#C084FC',
      skinOrChassisColor: '#E5B088',
      speedMultiplier: 1.08
    }
  },
  {
    id: 'robot',
    name: 'Byte-09',
    roleTitle: 'Autonomous Museum Curator Unit',
    badgeText: 'CURATOR BOT',
    tagline: 'Hovering droid programmed to index every commit and microservice in PyaeFolio.',
    primaryColor: '#06B6D4',
    secondaryColor: '#22D3EE',
    skinOrChassisColor: '#E2E8F0',
    speedMultiplier: 1.15,
    defaultConfig: {
      presetId: 'robot',
      displayName: 'Byte-09 (Curator Bot)',
      badgeText: 'CURATOR BOT',
      chassis: 'hover-bot',
      headwear: 'antenna',
      eyewear: 'cyber-visor',
      backwear: 'wings',
      companion: 'mini-drone',
      primaryColor: '#06B6D4',
      secondaryColor: '#22D3EE',
      skinOrChassisColor: '#E2E8F0',
      speedMultiplier: 1.15
    }
  },
  {
    id: 'designer',
    name: 'Liam Vance',
    roleTitle: 'Creative Product Designer',
    badgeText: 'UI/UX CRITIC',
    tagline: 'Admiring responsive layouts, liquid glass aesthetics, and mobile user flows.',
    primaryColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    skinOrChassisColor: '#C6865A',
    speedMultiplier: 1.05,
    defaultConfig: {
      presetId: 'designer',
      displayName: 'Liam (UI/UX Critic)',
      badgeText: 'UI/UX CRITIC',
      chassis: 'humanoid',
      headwear: 'beret',
      eyewear: 'sunglasses',
      backwear: 'scarf',
      companion: 'none',
      primaryColor: '#F59E0B',
      secondaryColor: '#FBBF24',
      skinOrChassisColor: '#C6865A',
      speedMultiplier: 1.05
    }
  }
];

export const PROJECT_EXHIBITS: ProjectExhibit[] = [
  {
    id: 'careerhub',
    number: '01',
    title: 'CareerHub',
    category: 'Full Stack',
    shortDesc: 'A job portal connecting job seekers and employers through role-based workflows.',
    techStack: ['React', 'Vite', 'Material UI', 'Context API', 'REST API'],
    imageUrl: '/assets/CareerHub.png',
    liveDemoUrl: 'https://car33rhub.netlify.app/',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/CareerHub',
    docsUrl: 'https://github.com/pyaephyo11979/CareerHub#readme',
    accentColor: '#0066FF',
    secondaryColor: '#60A5FA',
    dioramaType: 'careerhub',
    position: { x: -13, z: 24, rotationY: Math.PI / 2 },
    caseStudy: {
      problem:
        'Bring job discovery, candidate applications, and employer listings into one unified platform.',
      keyFeatures: [
        'Job search, candidate profiles, CV uploads and job applications.',
        'Employer job posting and listing management workflows.',
        'English/Myanmar bilingual support and adaptive light/dark themes.'
      ],
      engineering:
        'A React frontend uses Context API for shared state and integrates seamlessly with the CareerCraft REST API. Deployed continuously on Netlify.'
    }
  },
  {
    id: 'openpath-api',
    number: '02',
    title: 'Open Path Backend API',
    category: 'Backend',
    shortDesc:
      'REST API infrastructure for a mobile learning platform, from authentication to course management.',
    techStack: ['Node.js', 'Express', 'PostgreSQL', 'Prisma ORM', 'JWT', 'Joi'],
    imageUrl: '/assets/API.jpg',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/openpath_backend',
    docsUrl: 'https://github.com/pyaephyo11979/openpath_backend#readme',
    accentColor: '#10B981',
    secondaryColor: '#34D399',
    dioramaType: 'openpath-api',
    position: { x: -13, z: 36, rotationY: Math.PI / 2 },
    caseStudy: {
      problem:
        'Provide a scalable, shared backend for learning content, user accounts, and course enrollments.',
      keyFeatures: [
        'Course and lesson CRUD, learner profiles, and real-time enrollment tracking.',
        'JWT access and refresh tokens, role authorization, and strict Joi request validation.',
        'Firebase push notifications and S3-compatible cloud image storage.'
      ],
      engineering:
        'Express v5 serves structured REST endpoints. Prisma ORM manages relational PostgreSQL data, Joi validates incoming payloads, and dual-token JWT authentication secures sessions.'
    }
  },
  {
    id: 'openpath-mobile',
    number: '03',
    title: 'Open Path Mobile',
    category: 'Mobile',
    shortDesc: 'A Flutter learning app with video lessons, interactive quizzes, and progress tracking.',
    techStack: ['Flutter', 'Dart', 'Dio', 'go_router', 'Firebase FCM'],
    imageUrl: '/assets/Open_Path_Mobile.png',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/open_path',
    docsUrl: 'https://github.com/pyaephyo11979/open_path#readme',
    accentColor: '#06B6D4',
    secondaryColor: '#38BDF8',
    dioramaType: 'openpath-mobile',
    position: { x: -13, z: 48, rotationY: Math.PI / 2 },
    caseStudy: {
      problem:
        'Make learning content and student progress accessible through a smooth cross-platform mobile experience.',
      keyFeatures: [
        'YouTube-powered video lessons, interactive quizzes, and attempt history.',
        'Real-time learning progress tracking with adaptive light/dark themes.',
        'Firebase FCM push & local notifications with polished skeleton loading states.'
      ],
      engineering:
        'Structured with a clean Views → Controllers → Repositories → Models architecture separating UI from data access. Dio interceptors transparently refresh JWT tokens while go_router manages deep links.'
    }
  },
  {
    id: 'careercraft-api',
    number: '04',
    title: 'CareerCraft API',
    category: 'Backend',
    shortDesc:
      'A backend REST API powering job workflows with authentication, authorization, and data validation.',
    techStack: ['Node.js', 'Express', 'MongoDB', 'JWT'],
    imageUrl: '/assets/API.jpg',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/workSearchingProgramme/tree/main/backend',
    accentColor: '#8B5CF6',
    secondaryColor: '#A78BFA',
    dioramaType: 'careercraft',
    position: { x: -13, z: 60, rotationY: Math.PI / 2 },
    caseStudy: {
      problem:
        'Deliver secure document-oriented persistence and role-based access control for job marketplace operations.',
      keyFeatures: [
        'JWT-secured authentication and employer/candidate role guards.',
        'MongoDB collections for job postings, candidate resumes, and application states.',
        'RESTful endpoints consumed directly by the CareerHub frontend client.'
      ],
      engineering:
        'Built on Node.js and Express with MongoDB/Mongoose schemas, middleware-driven request validation, and token-based session security.'
    }
  },
  {
    id: 'weather-app',
    number: '05',
    title: 'Weather Application',
    category: 'Frontend',
    shortDesc: 'Location-based weather forecasts with dynamic atmospheric visual displays.',
    techStack: ['React', 'API Integration', 'Geolocation'],
    sourceCodeUrl: 'https://github.com/pyaephyo11979/WeatherApp',
    accentColor: '#F59E0B',
    secondaryColor: '#FBBF24',
    dioramaType: 'weather',
    position: { x: 13, z: 24, rotationY: -Math.PI / 2 },
    caseStudy: {
      problem:
        'Present real-time meteorological telemetry and localized forecasts in an intuitive visual dashboard.',
      keyFeatures: [
        'Browser Geolocation API detection for instant local weather lookup.',
        'City search with live temperature, humidity, wind speed, and condition icons.',
        'Responsive cards adapting to clear, cloudy, and rainy forecast states.'
      ],
      engineering:
        'Constructed in React using asynchronous REST API integration, custom hooks for geolocation state, and clean error handling.'
    }
  },
  {
    id: 'readers-choice',
    number: '06',
    title: "Readers' Choice",
    category: 'Frontend',
    shortDesc: 'An online digital library frontend with a curated, responsive reading catalog layout.',
    techStack: ['Responsive Design', 'API Integration', 'Modern CSS'],
    imageUrl: '/assets/ReadersChoice.png',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/RC',
    accentColor: '#EC4899',
    secondaryColor: '#F472B6',
    dioramaType: 'readers-choice',
    position: { x: 13, z: 36, rotationY: -Math.PI / 2 },
    caseStudy: {
      problem:
        'Create an inviting, accessible book discovery interface that scales cleanly from mobile phones to desktop monitors.',
      keyFeatures: [
        'Curated book catalog grids with genre filtering and quick search.',
        'Fluid typography and responsive card layouts for distraction-free browsing.',
        'Dynamic book metadata fetching via external API integration.'
      ],
      engineering:
        'Focused on semantic HTML, responsive CSS grid/flexbox architecture, and asynchronous API fetching for catalog rendering.'
    }
  },
  {
    id: 'travel-relax',
    number: '07',
    title: 'Travel Relax',
    category: 'Full Stack',
    shortDesc:
      'A full-stack travel agency platform with authentication, destination booking, and payment workflows.',
    techStack: ['JavaEE', 'JSP', 'MySQL', 'Spring Boot'],
    imageUrl: '/assets/TravelRelax.png',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/TravelAgencyProjecct',
    accentColor: '#0EA5E9',
    secondaryColor: '#38BDF8',
    dioramaType: 'travel-relax',
    position: { x: 13, z: 48, rotationY: -Math.PI / 2 },
    caseStudy: {
      problem:
        'Streamline end-to-end travel package browsing, itinerary reservation, and customer checkout in one enterprise web app.',
      keyFeatures: [
        'User authentication, tour package catalog, and date-based booking engine.',
        'Structured payment workflow and booking confirmation receipts.',
        'Admin management for destinations, pricing, and customer reservations.'
      ],
      engineering:
        'Engineered with JavaEE, JSP, and Spring Boot backed by a relational MySQL database for transactional booking integrity.'
    }
  },
  {
    id: 'voting-system',
    number: '08',
    title: 'Voting System',
    category: 'Full Stack',
    shortDesc: 'An interactive distributed voting application featuring real-time result visualization.',
    techStack: ['React', 'Java RMI', 'Spring Boot', 'MySQL'],
    imageUrl: '/assets/VotingSystem.png',
    sourceCodeUrl: 'https://github.com/pyaephyo11979/VotingSystem',
    accentColor: '#6366F1',
    secondaryColor: '#818CF8',
    dioramaType: 'voting-system',
    position: { x: 13, z: 60, rotationY: -Math.PI / 2 },
    caseStudy: {
      problem:
        'Enable tamper-resistant ballot casting and live vote tallying across distributed client nodes.',
      keyFeatures: [
        'Interactive React ballot interface with instant live tally charts.',
        'Distributed remote method invocation using Java RMI & Spring Boot.',
        'Persistent MySQL audit storage preventing duplicate voter submissions.'
      ],
      engineering:
        'Combines a reactive React frontend with a Spring Boot and Java RMI backend architecture backed by MySQL.'
    }
  }
];

export const SKILL_PILLARS: SkillPillar[] = [
  {
    id: 'skill-frontend',
    category: 'Frontend Engineering',
    subtitle: 'Interactive UI & State Management',
    color: '#0066FF',
    iconSymbol: '⚛',
    skills: ['React', 'JavaScript (ES6+)', 'TypeScript', 'Redux', 'Tailwind CSS', 'Responsive Design'],
    position: { x: 26, z: -10 }
  },
  {
    id: 'skill-backend',
    category: 'Backend Architecture',
    subtitle: 'APIs, Security & Server Logic',
    color: '#10B981',
    iconSymbol: '⚙',
    skills: ['Node.js', 'Express', 'Laravel', 'REST APIs', 'JWT Authentication', 'Authorization'],
    position: { x: 35, z: -6 }
  },
  {
    id: 'skill-mobile',
    category: 'Mobile Development',
    subtitle: 'Cross-Platform Native Feel',
    color: '#06B6D4',
    iconSymbol: '📱',
    skills: ['Flutter', 'Dart', 'REST API Integration', 'Firebase FCM', 'Dio & go_router'],
    position: { x: 42, z: 0 }
  },
  {
    id: 'skill-database',
    category: 'Database & ORM',
    subtitle: 'Relational & Document Stores',
    color: '#8B5CF6',
    iconSymbol: '🗄',
    skills: ['PostgreSQL', 'MongoDB', 'MySQL', 'Prisma ORM', 'Mongoose'],
    position: { x: 35, z: 6 }
  },
  {
    id: 'skill-tools',
    category: 'Dev Tools & Workflow',
    subtitle: 'Version Control & Quality',
    color: '#F59E0B',
    iconSymbol: '🛠',
    skills: ['Git', 'GitHub', 'VS Code', 'Postman', 'ESLint'],
    position: { x: 26, z: 10 }
  }
];

export const EXPERIENCE_ITEMS: ExperienceItem[] = [
  {
    id: 'exp-tech-breeze',
    role: 'Backend Developer Intern',
    organization: 'Tech Breeze Limited',
    period: 'April 2025 – Present (Current Position)',
    type: 'Work Experience',
    logoUrl: '/assets/techbreeze-icon.svg',
    website: 'https://www.tech-breeze.com.mm/about-grand',
    summary:
      'Developing production backend services for e-commerce applications using Laravel, designing relational database schemas, and building RESTful API endpoints.',
    highlights: [
      'Architected e-commerce backend services and modular API controllers using Laravel.',
      'Designed normalized database schemas and optimized query performance.',
      'Collaborated with frontend and mobile consumers to deliver reliable REST APIs.'
    ],
    color: '#0066FF',
    position: { x: -27, z: -8, rotationY: Math.PI / 4 }
  },
  {
    id: 'exp-brainwave',
    role: 'Intern Software Engineer',
    organization: 'Brainwave Data Co., Ltd.',
    period: 'April 2026 – July 2026',
    type: 'Work Experience',
    logoUrl: '/assets/brainwave-icon.png',
    website: 'https://www.bdata.com.mm/',
    summary:
      'Participated in full-lifecycle software development projects, strengthening engineering practices in collaborative teamwork and modern programming.',
    highlights: [
      'Contributed to team-based software engineering sprints and code reviews.',
      'Translated business requirements into maintainable application features.',
      'Enhanced debugging, testing, and agile delivery workflows.'
    ],
    color: '#7C3AED',
    position: { x: -37, z: 0, rotationY: Math.PI / 2 }
  },
  {
    id: 'edu-ucss',
    role: 'Bachelor of Computing in Computer Science',
    organization: 'University of Computer Studies (Sittwe & Pathein)',
    period: '2019 – 2027',
    type: 'Education',
    summary:
      'Pursuing a comprehensive Computer Science degree covering algorithms, distributed systems, software engineering, and database management while building self-taught full-stack projects.',
    highlights: [
      'Core foundation in Data Structures, Object-Oriented Programming (Java), and Databases.',
      'Bridged academic theory with hands-on React, Node.js, Express, and Flutter ecosystems.',
      'Built 8+ full-stack, backend, mobile, and frontend portfolio applications.'
    ],
    color: '#10B981',
    position: { x: -27, z: 8, rotationY: (3 * Math.PI) / 4 }
  }
];

export const LIVE_CHAT_EMOTES: string[] = [
  '👋 Hello fellow museum visitors!',
  '🔥 Checking out #01 CareerHub!',
  '📱 Impressed by Open Path Mobile & API!',
  '💼 Reviewing Pyae Phyo Hlaing’s Resume!',
  '🤖 Chatting with PyaeBot AI Guide!',
  '🌟 Awesome 3D BabylonJS portfolio!'
];

export interface WingTeleportPoint {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  x: number;
  z: number;
  lookAtX: number;
  lookAtZ: number;
}

export const MUSEUM_WINGS: WingTeleportPoint[] = [
  {
    id: 'rotunda',
    label: 'Grand Rotunda (Atrium)',
    shortLabel: 'Atrium',
    description: 'Central welcome hall, PyaeFolio hologram & Curator desk',
    x: 0,
    z: -4,
    lookAtX: 0,
    lookAtZ: 4
  },
  {
    id: 'projects',
    label: 'North Wing: Project Gallery',
    shortLabel: 'Projects (8)',
    description: 'All 8 interactive 3D project dioramas & engineering case studies',
    x: 0,
    z: 20,
    lookAtX: 0,
    lookAtZ: 45
  },
  {
    id: 'skills',
    label: 'East Wing: Tech Arsenal',
    shortLabel: 'Skills',
    description: '5 interactive monuments of Frontend, Backend, Mobile, DB & Tools',
    x: 20,
    z: 0,
    lookAtX: 35,
    lookAtZ: 0
  },
  {
    id: 'experience',
    label: 'West Wing: Career & Education',
    shortLabel: 'Experience',
    description: 'Tech Breeze Limited, Brainwave Data & University of Computer Studies',
    x: -18,
    z: 0,
    lookAtX: -32,
    lookAtZ: 0
  },
  {
    id: 'contact',
    label: 'South Wing: Connection Lounge',
    shortLabel: 'Contact & CV',
    description: 'Direct social portals, Resume download & Visitor Guestbook',
    x: 0,
    z: -16,
    lookAtX: 0,
    lookAtZ: -28
  }
];

export interface PreservedQAAction {
  label: string;
  type: 'teleport-wing' | 'teleport-project' | 'external-link';
  targetId?: string;
  url?: string;
}

export interface PreservedQAItem {
  id: string;
  chipLabel: string;
  question: string;
  category: 'Profile' | 'Projects' | 'Skills' | 'Experience' | 'Museum';
  keywords: string[];
  answer: string;
  botThought: string;
  action?: PreservedQAAction;
}

export const HELP_BOT_CONFIG: CharacterCustomizationConfig = {
  presetId: 'robot',
  displayName: 'PyaeBot (AI Guide)',
  badgeText: 'AI GUIDE BOT',
  chassis: 'humanoid',
  headwear: 'antenna',
  eyewear: 'cyber-visor',
  backwear: 'wings',
  companion: 'holo-cube',
  primaryColor: '#10B981',
  secondaryColor: '#38BDF8',
  skinOrChassisColor: '#F8FAFC',
  speedMultiplier: 1.15
};

export const HELP_BOT_TOUR_WAYPOINTS: Array<{
  x: number;
  z: number;
  pauseSeconds: number;
  thought: string;
}> = [
  {
    x: 3.6,
    z: 1.2,
    pauseSeconds: 4.5,
    thought: 'Hi! I am PyaeBot 🤖 — click me or press E to ask anything!'
  },
  {
    x: -7.5,
    z: 24,
    pauseSeconds: 4.5,
    thought: 'Touring #01 CareerHub: React + MUI bilingual job portal!'
  },
  {
    x: 7.5,
    z: 24,
    pauseSeconds: 4.0,
    thought: 'Touring #05 Weather App: React + live Geolocation API!'
  },
  {
    x: -7.5,
    z: 36,
    pauseSeconds: 4.5,
    thought: '#02 Open Path API: Express v5, PostgreSQL & Prisma ORM!'
  },
  {
    x: 7.5,
    z: 36,
    pauseSeconds: 4.0,
    thought: "#06 Readers' Choice: Responsive digital library frontend!"
  },
  {
    x: -7.5,
    z: 48,
    pauseSeconds: 4.5,
    thought: '#03 Open Path Mobile: Flutter, Dio JWT refresh & quizzes!'
  },
  {
    x: 7.5,
    z: 48,
    pauseSeconds: 4.0,
    thought: '#07 Travel Relax: Spring Boot, JavaEE & MySQL booking!'
  },
  {
    x: -7.5,
    z: 60,
    pauseSeconds: 4.5,
    thought: '#04 CareerCraft API: Node.js, Express, MongoDB & JWT!'
  },
  {
    x: 7.5,
    z: 60,
    pauseSeconds: 4.5,
    thought: '#08 Voting System: React + Java RMI + Spring Boot!'
  },
  {
    x: 20,
    z: 0,
    pauseSeconds: 4.5,
    thought: 'East Wing: Inspecting Pyae’s 5 Full-Stack & Mobile Skill Pillars!'
  },
  {
    x: -19,
    z: 0,
    pauseSeconds: 4.5,
    thought: 'West Wing: Tech Breeze Limited & Brainwave Data internships!'
  },
  {
    x: 0,
    z: -16,
    pauseSeconds: 4.5,
    thought: 'South Lounge: Download Pyae’s CV or connect on GitHub!'
  }
];

export const PRESERVED_QAS: PreservedQAItem[] = [
  {
    id: 'qa-who-is-pyae',
    chipLabel: '👋 Who is Pyae Phyo Hlaing?',
    question: 'Who is Pyae Phyo Hlaing and what does he specialize in?',
    category: 'Profile',
    keywords: ['who', 'pyae', 'about', 'bio', 'introduce', 'developer', 'background', 'location', 'myanmar', 'yangon'],
    answer:
      "Pyae Phyo Hlaing is a Junior Full Stack Developer based in Yangon, Myanmar. He specializes in building end-to-end web and mobile applications using React, Node.js, Express, Laravel, MongoDB, PostgreSQL, and Flutter. Alongside his Computer Science degree at the University of Computer Studies (Sittwe & Pathein), he has gained industry experience as a Backend Developer Intern at Tech Breeze Limited and Intern Software Engineer at Brainwave Data Co., Ltd.",
    botThought: 'Pyae is a Full-Stack & Flutter Developer in Yangon!',
    action: {
      label: '📍 Teleport to Grand Rotunda Profile',
      type: 'teleport-wing',
      targetId: 'rotunda'
    }
  },
  {
    id: 'qa-tech-stack',
    chipLabel: '🛠 Core Tech Stack & Skills',
    question: "What is Pyae Phyo Hlaing's technical stack across Frontend, Backend, Mobile, and Databases?",
    category: 'Skills',
    keywords: ['skill', 'tech', 'stack', 'language', 'framework', 'frontend', 'backend', 'database', 'react', 'node', 'flutter', 'laravel', 'prisma', 'sql', 'mongodb'],
    answer:
      "Pyae works across 5 core engineering pillars:\n• Frontend: React, TypeScript, JavaScript (ES6+), Redux, Material UI, Tailwind CSS, Responsive Design\n• Backend: Node.js, Express (v5), Laravel (PHP), Spring Boot / JavaEE, REST APIs, JWT Auth & Joi Validation\n• Mobile: Flutter, Dart, Dio (with JWT refresh interceptors), go_router, Firebase Cloud Messaging (FCM)\n• Databases & ORM: PostgreSQL, Prisma ORM, MongoDB, Mongoose, MySQL\n• Dev Tools: Git, GitHub, Postman, VS Code, ESLint, Netlify CI/CD.",
    botThought: 'React + Node/Express/Laravel + Flutter + Postgres/Mongo!',
    action: {
      label: '⚡ Visit East Skills Wing',
      type: 'teleport-wing',
      targetId: 'skills'
    }
  },
  {
    id: 'qa-careerhub',
    chipLabel: '💼 CareerHub & CareerCraft (#01/#04)',
    question: 'Tell me about CareerHub and the CareerCraft API.',
    category: 'Projects',
    keywords: ['careerhub', 'careercraft', 'job', 'portal', 'bilingual', 'employer', 'candidate', 'exhibit 1', 'exhibit 4'],
    answer:
      "CareerHub (Exhibit #01) is a full-stack job portal connecting job seekers and employers with role-based workflows, CV uploads, job postings, English/Myanmar bilingual support, and light/dark themes. It is built with React, Vite, Material UI, and Context API, powered by the CareerCraft REST API (Exhibit #04 — Node.js, Express, MongoDB, and JWT role guards).",
    botThought: 'CareerHub (#01) features EN/MM bilingual support & live demo!',
    action: {
      label: '🚀 Teleport to #01 CareerHub Exhibit',
      type: 'teleport-project',
      targetId: 'careerhub'
    }
  },
  {
    id: 'qa-openpath',
    chipLabel: '📱 Open Path Mobile & API (#02/#03)',
    question: 'How are Open Path Mobile and the Open Path Backend API architected?',
    category: 'Projects',
    keywords: ['open path', 'openpath', 'mobile', 'flutter', 'learning', 'course', 'prisma', 'postgresql', 'quiz', 'exhibit 2', 'exhibit 3'],
    answer:
      "Open Path is a cross-platform mobile learning ecosystem split into two exhibits:\n• Open Path Backend API (Exhibit #02): Built with Node.js, Express v5, PostgreSQL, and Prisma ORM. Features dual-token JWT auth, Joi validation, S3-compatible image storage, and Firebase push notifications.\n• Open Path Mobile (Exhibit #03): Built with Flutter & Dart using a clean Views → Controllers → Repositories → Models architecture, YouTube video lessons, interactive quizzes, Dio JWT auto-refresh interceptors, and go_router navigation.",
    botThought: 'Open Path pairs Flutter + Dio with Express v5 + Prisma!',
    action: {
      label: '📱 Teleport to #03 Open Path Mobile',
      type: 'teleport-project',
      targetId: 'openpath-mobile'
    }
  },
  {
    id: 'qa-all-projects',
    chipLabel: '🏛 All 8 Museum Exhibits',
    question: 'What are all 8 software engineering projects showcased in the North Wing?',
    category: 'Projects',
    keywords: ['projects', 'all', 'list', 'portfolio', 'north wing', 'exhibits', 'voting', 'travel', 'weather', 'readers'],
    answer:
      "The North Project Wing showcases 8 interactive 3D exhibits:\n1. #01 CareerHub (Full Stack — React, MUI, Context API)\n2. #02 Open Path Backend API (Backend — Node.js, Express v5, PostgreSQL, Prisma)\n3. #03 Open Path Mobile (Mobile — Flutter, Dart, Dio, Firebase FCM)\n4. #04 CareerCraft API (Backend — Node.js, Express, MongoDB, JWT)\n5. #05 Weather Application (Frontend — React, Geolocation API)\n6. #06 Readers' Choice (Frontend — Digital Library, Responsive CSS & API)\n7. #07 Travel Relax (Full Stack — JavaEE, JSP, Spring Boot, MySQL)\n8. #08 Voting System (Full Stack — React, Java RMI, Spring Boot, MySQL).",
    botThought: 'All 8 projects have 3D dioramas in the North Wing!',
    action: {
      label: '🏛 Teleport to North Project Wing',
      type: 'teleport-wing',
      targetId: 'projects'
    }
  },
  {
    id: 'qa-experience',
    chipLabel: '🏢 Internships & Work Experience',
    question: "What real-world company internships and work experience does Pyae Phyo Hlaing have?",
    category: 'Experience',
    keywords: ['experience', 'internship', 'work', 'company', 'tech breeze', 'brainwave', 'job', 'laravel', 'career'],
    answer:
      "Pyae has hands-on industry experience at two software companies:\n1. Backend Developer Intern @ Tech Breeze Limited (April 2025 – Present): Architecting production e-commerce backend services and modular REST API controllers with Laravel, plus relational database schema design and query optimization.\n2. Intern Software Engineer @ Brainwave Data Co., Ltd. (April 2026 – July 2026): Full-lifecycle software development sprints, translating business requirements into maintainable features, code reviews, and agile delivery.",
    botThought: 'Pyae interns at Tech Breeze Limited & Brainwave Data!',
    action: {
      label: '🏢 Teleport to West Experience Wing',
      type: 'teleport-wing',
      targetId: 'experience'
    }
  },
  {
    id: 'qa-education',
    chipLabel: '🎓 Computer Science Education',
    question: 'Where is Pyae studying Computer Science?',
    category: 'Experience',
    keywords: ['education', 'university', 'degree', 'study', 'college', 'ucs', 'sittwe', 'pathein', 'student', 'bachelor'],
    answer:
      "Pyae is pursuing a Bachelor of Computing in Computer Science (2019–2027) at the University of Computer Studies (Sittwe & Pathein). His academic coursework covers Data Structures & Algorithms, Object-Oriented Programming (Java), Distributed Systems (Java RMI), and Relational Databases, which he pairs with modern React, Node.js, and Flutter engineering.",
    botThought: 'B.C.Sc. at University of Computer Studies (Sittwe & Pathein)!',
    action: {
      label: '🎓 View West Experience & Education Wing',
      type: 'teleport-wing',
      targetId: 'experience'
    }
  },
  {
    id: 'qa-contact-cv',
    chipLabel: '📬 Contact, Hiring & Resume/CV',
    question: 'How can I contact Pyae Phyo Hlaing or download his Resume / CV?',
    category: 'Profile',
    keywords: ['contact', 'email', 'phone', 'hire', 'resume', 'cv', 'github', 'linkedin', 'reach', 'download'],
    answer:
      "You can reach Pyae Phyo Hlaing directly via:\n• Email: pyarephyoehlaing16@gmail.com\n• Phone: +95 9757524978\n• GitHub: github.com/pyaephyo11979\n• LinkedIn: linkedin.com/in/pyareph\n• Classic 2D Portfolio: pyaefolio.netlify.app\nYou can also visit the South Connection Lounge or click below to view/download his official PDF Resume!",
    botThought: 'Reach Pyae via email, LinkedIn, GitHub, or download his CV!',
    action: {
      label: '📄 View Official Resume / CV ↗',
      type: 'external-link',
      url: PROFILE_DATA.contact.resumeView
    }
  },
  {
    id: 'qa-museum-guide',
    chipLabel: '🎮 How to Explore the 3D Museum',
    question: 'How do I control my character and explore all features of this 3D Museum?',
    category: 'Museum',
    keywords: ['help', 'control', 'move', 'walk', 'how to play', 'museum', 'stamp', 'passport', 'customize', 'mobile', 'night', 'blame'],
    answer:
      "Welcome to PyaeFolio 3D Museum! Here is how to explore:\n• Move: Use WASD / Arrow Keys, click any floor tile to walk there, or use the on-screen D-Pad & Joystick on mobile.\n• Inspect & Git Blame: Step onto any glowing floor ring and press E to view case studies, run 'git blame' on Pyae's code, and stamp your Visitor Passport.\n• 3D Blame Action: Click '🎯 Blame' in the HUD or Live Visitors panel to playfully tag live visitors or PyaeBot with a 3D laser ring!\n• Customize Avatar: Click '🎨 Customize Avatar' in the top bar.",
    botThought: 'Try running git blame on any exhibit or blaming me in 3D! 🎯'
  }
];

export interface GitBlameLine {
  hash: string;
  author: string;
  date: string;
  lineNo: number;
  code: string;
  commitMsg: string;
}

export interface ProjectGitBlame {
  filePath: string;
  branch: string;
  totalCommits: number;
  ownership: string;
  lines: GitBlameLine[];
}

export const PROJECT_GIT_BLAME_MAP: Record<string, ProjectGitBlame> = {
  careerhub: {
    filePath: 'src/context/JobPortalContext.jsx',
    branch: 'main',
    totalCommits: 64,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: 'a8f3c19',
        author: 'pyaephyo11979',
        date: '2025-11-12',
        lineNo: 1,
        code: 'export const JobPortalProvider = ({ children }) => {',
        commitMsg: 'feat(context): initialize global CareerHub state provider for seekers & employers'
      },
      {
        hash: 'a8f3c19',
        author: 'pyaephyo11979',
        date: '2025-11-12',
        lineNo: 2,
        code: "  const [locale, setLocale] = useState(localStorage.getItem('lang') || 'en');",
        commitMsg: 'feat(i18n): add persistent English/Myanmar bilingual toggle state'
      },
      {
        hash: 'c42d90b',
        author: 'pyaephyo11979',
        date: '2025-11-18',
        lineNo: 3,
        code: '  const applyForJob = async (jobId, cvFile, coverNote) => {',
        commitMsg: 'feat(applications): wire candidate CV multipart upload to CareerCraft API'
      },
      {
        hash: 'c42d90b',
        author: 'pyaephyo11979',
        date: '2025-11-18',
        lineNo: 4,
        code: '    const res = await apiClient.post(`/jobs/${jobId}/apply`, { cvFile, coverNote });',
        commitMsg: 'feat(api): attach JWT bearer token & handle employer notification trigger'
      },
      {
        hash: 'f91e77a',
        author: 'pyaephyo11979',
        date: '2025-11-24',
        lineNo: 5,
        code: '    dispatch({ type: "APPLICATION_SUBMITTED", payload: res.data });',
        commitMsg: 'perf(state): optimistic UI update on candidate application status'
      }
    ]
  },
  'openpath-api': {
    filePath: 'src/middlewares/validateAndAuth.ts',
    branch: 'main',
    totalCommits: 78,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: 'd19b402',
        author: 'pyaephyo11979',
        date: '2025-12-03',
        lineNo: 1,
        code: 'export const verifyAccessToken = async (req, res, next) => {',
        commitMsg: 'feat(auth): implement dual-token JWT verification middleware in Express v5'
      },
      {
        hash: 'd19b402',
        author: 'pyaephyo11979',
        date: '2025-12-03',
        lineNo: 2,
        code: '  const payload = jwt.verify(req.token, process.env.JWT_ACCESS_SECRET);',
        commitMsg: 'security(jwt): enforce strict signature & short-lived access token TTL'
      },
      {
        hash: '77e2a14',
        author: 'pyaephyo11979',
        date: '2025-12-09',
        lineNo: 3,
        code: '  req.learner = await prisma.user.findUnique({ where: { id: payload.sub } });',
        commitMsg: 'feat(prisma): hydrate authenticated learner profile from PostgreSQL'
      },
      {
        hash: '90c4f88',
        author: 'pyaephyo11979',
        date: '2025-12-15',
        lineNo: 4,
        code: '  const { error } = enrollmentSchema.validate(req.body, { abortEarly: false });',
        commitMsg: 'feat(validation): add strict Joi request payload validation for course enrollment'
      },
      {
        hash: '33a8b51',
        author: 'pyaephyo11979',
        date: '2025-12-20',
        lineNo: 5,
        code: '  await fcmAdmin.messaging().send({ token: req.learner.fcmToken, notification });',
        commitMsg: 'feat(fcm): dispatch Firebase push notification on course milestone completion'
      }
    ]
  },
  'openpath-mobile': {
    filePath: 'lib/core/network/jwt_interceptor.dart',
    branch: 'main',
    totalCommits: 82,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: 'b50c318',
        author: 'pyaephyo11979',
        date: '2026-01-08',
        lineNo: 1,
        code: 'class JwtRefreshInterceptor extends QueuedInterceptorsWrapper {',
        commitMsg: 'feat(network): queue concurrent Dio requests during silent JWT token refresh'
      },
      {
        hash: 'b50c318',
        author: 'pyaephyo11979',
        date: '2026-01-08',
        lineNo: 2,
        code: '  @override Future<void> onError(DioException err, ErrorInterceptorHandler h) async {',
        commitMsg: 'fix(auth): intercept HTTP 401 responses and rotate refresh token automatically'
      },
      {
        hash: '62f190e',
        author: 'pyaephyo11979',
        date: '2026-01-14',
        lineNo: 3,
        code: '    final newTokens = await authRepository.refreshSession(storedRefreshToken);',
        commitMsg: 'feat(repo): decouple token persistence in clean Repository architecture'
      },
      {
        hash: '88d4c21',
        author: 'pyaephyo11979',
        date: '2026-01-21',
        lineNo: 4,
        code: '    err.requestOptions.headers["Authorization"] = "Bearer ${newTokens.access}";',
        commitMsg: 'feat(dio): replay original failed lesson/quiz request with fresh access token'
      },
      {
        hash: '14a9e03',
        author: 'pyaephyo11979',
        date: '2026-01-27',
        lineNo: 5,
        code: '    return h.resolve(await dio.fetch(err.requestOptions));',
        commitMsg: 'perf(ux): seamless zero-interruption video lesson playback across token expiry'
      }
    ]
  },
  'careercraft-api': {
    filePath: 'backend/controllers/jobController.js',
    branch: 'main',
    totalCommits: 52,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: '41c8e22',
        author: 'pyaephyo11979',
        date: '2025-10-04',
        lineNo: 1,
        code: 'exports.createJobListing = async (req, res, next) => {',
        commitMsg: 'feat(jobs): add employer role-guarded endpoint for publishing job listings'
      },
      {
        hash: '41c8e22',
        author: 'pyaephyo11979',
        date: '2025-10-04',
        lineNo: 2,
        code: '  if (req.user.role !== "employer") return res.status(403).json({ error: "Forbidden" });',
        commitMsg: 'security(rbac): enforce strict role-based access control on employer mutations'
      },
      {
        hash: '79b0d11',
        author: 'pyaephyo11979',
        date: '2025-10-11',
        lineNo: 3,
        code: '  const listing = await JobModel.create({ ...req.body, employerId: req.user.id });',
        commitMsg: 'feat(mongodb): persist validated Mongoose job schema with indexed category tags'
      },
      {
        hash: '95e3a40',
        author: 'pyaephyo11979',
        date: '2025-10-17',
        lineNo: 4,
        code: '  return res.status(201).json({ status: "success", data: listing });',
        commitMsg: 'refactor(api): standardize JSON envelope consumed by CareerHub React client'
      }
    ]
  },
  'weather-app': {
    filePath: 'src/hooks/useWeatherTelemetry.js',
    branch: 'main',
    totalCommits: 34,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: '22f7b19',
        author: 'pyaephyo11979',
        date: '2025-07-12',
        lineNo: 1,
        code: 'export function useWeatherTelemetry(defaultCity = "Yangon") {',
        commitMsg: 'feat(hooks): create custom React hook for live meteorological telemetry'
      },
      {
        hash: '58a1c04',
        author: 'pyaephyo11979',
        date: '2025-07-15',
        lineNo: 2,
        code: '  navigator.geolocation.getCurrentPosition(({ coords }) => fetchByCoords(coords));',
        commitMsg: 'feat(geo): integrate browser Geolocation API for automatic local forecast'
      },
      {
        hash: '91d6e88',
        author: 'pyaephyo11979',
        date: '2025-07-19',
        lineNo: 3,
        code: '  const themeMood = mapWeatherCodeToAtmosphere(telemetry.weather[0].id);',
        commitMsg: 'ui(theme): dynamically adapt card gradients to clear, rain, and storm states'
      }
    ]
  },
  'readers-choice': {
    filePath: 'src/scripts/catalogRenderer.js',
    branch: 'main',
    totalCommits: 39,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: '30e9a12',
        author: 'pyaephyo11979',
        date: '2025-08-05',
        lineNo: 1,
        code: 'export async function loadCuratedBooks(genreFilter = "all", query = "") {',
        commitMsg: 'feat(catalog): implement asynchronous book search and genre filtering'
      },
      {
        hash: '67c2b55',
        author: 'pyaephyo11979',
        date: '2025-08-09',
        lineNo: 2,
        code: '  const books = await fetchCatalogEndpoint({ genre: genreFilter, q: query });',
        commitMsg: 'perf(api): debounce search input to minimize redundant catalog network calls'
      },
      {
        hash: '84f1d30',
        author: 'pyaephyo11979',
        date: '2025-08-14',
        lineNo: 3,
        code: '  gridContainer.style.gridTemplateColumns = "repeat(auto-fill, minmax(220px, 1fr))";',
        commitMsg: 'style(responsive): fluid CSS Grid book cards scaling from mobile to desktop'
      }
    ]
  },
  'travel-relax': {
    filePath: 'src/main/java/com/travelrelax/service/BookingService.java',
    branch: 'main',
    totalCommits: 58,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: 'e12a809',
        author: 'pyaephyo11979',
        date: '2025-09-02',
        lineNo: 1,
        code: '@Transactional(isolation = Isolation.REPEATABLE_READ)',
        commitMsg: 'feat(booking): enforce ACID transaction isolation on MySQL seat reservations'
      },
      {
        hash: 'e12a809',
        author: 'pyaephyo11979',
        date: '2025-09-02',
        lineNo: 2,
        code: 'public BookingReceipt reserveTourPackage(Long userId, Long packageId, LocalDate date) {',
        commitMsg: 'feat(service): validate tour availability and lock itinerary dates'
      },
      {
        hash: 'b44d192',
        author: 'pyaephyo11979',
        date: '2025-09-10',
        lineNo: 3,
        code: '  PaymentRecord payment = paymentGateway.authorizeCheckout(userId, pkg.getPrice());',
        commitMsg: 'feat(payment): integrate structured checkout receipt generation in Spring Boot'
      }
    ]
  },
  'voting-system': {
    filePath: 'src/main/java/com/voting/rmi/VoteTallyRemoteImpl.java',
    branch: 'main',
    totalCommits: 61,
    ownership: '100% Pyae Phyo Hlaing (@pyaephyo11979)',
    lines: [
      {
        hash: '7c90e41',
        author: 'pyaephyo11979',
        date: '2025-09-22',
        lineNo: 1,
        code: 'public synchronized TallySnapshot castEncryptedBallot(String voterToken, Long candidateId) throws RemoteException {',
        commitMsg: 'feat(rmi): thread-safe remote method invocation for distributed ballot nodes'
      },
      {
        hash: '92a3f18',
        author: 'pyaephyo11979',
        date: '2025-09-25',
        lineNo: 2,
        code: '  if (auditRepository.existsByVoterHash(sha256(voterToken))) throw new DuplicateVoteException();',
        commitMsg: 'security(audit): prevent duplicate ballot submission in MySQL audit ledger'
      },
      {
        hash: 'd05b77c',
        author: 'pyaephyo11979',
        date: '2025-09-29',
        lineNo: 3,
        code: '  return tallyBroadcaster.publishLiveSnapshot(auditRepository.countByCandidate());',
        commitMsg: 'feat(realtime): push live vote counts to React visualization dashboard'
      }
    ]
  }
};

export const BLAME_PRESET_REASONS: string[] = [
  '🐛 Blamed for shipping 10x code on Friday!',
  '☕ Blamed for drinking the last cup of coffee!',
  '🔥 git blame says: 100% clean architecture!',
  '🧪 Blamed for passing all unit tests on 1st try!',
  '🚀 Blamed for speeding in the North Project Wing!'
];

export const PYAEBOT_BLAME_COMEBACKS: string[] = [
  'Hey! git blame proves my circuits passed 100% of unit tests! 🤖✨',
  'Objection! That bug was an undocumented feature in commit #a8f3c19! 😅',
  'It works on my Docker container! Check Pyae’s GitHub commits! 🐳🤖',
  'Me?! I was busy indexing Exhibit #02 Open Path Backend API! ⚡',
  '418 I’m a Teapot — cannot be blamed for missing semicolons! ☕🤖'
];


