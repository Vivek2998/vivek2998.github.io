/**
 * Every word and link on the site lives here.
 *
 * The components below read from this file and nothing else, so updating the
 * site means editing this one file — no JSX to hunt through.
 */

export const profile = {
  name: 'Vivek Kumar',
  /* Deliberately role-neutral: no employer name, so this stays true across job
     changes and keeps the projects doing the talking. */
  role: 'Engineer',
  disciplines: ['Embedded Linux', 'Robotics', 'Full-stack'],
  location: 'Gurugram, India',
  tagline: 'I build the layer between hardware and the people who depend on it.',
  intro: `I'm an Electronics & Communication engineer who kept drifting toward the
    seam where firmware meets software. I've designed RTL for a RISC-V core, shipped
    test automation for surgical robotics, and built Yocto-based Linux images for
    medical appliances — plus the web tooling that makes any of it usable.`,
  secondary: `Away from the terminal I sketch, watch far too much anime, and take the
    bike out when the roads are empty.`,
  /* Rotates in the hero. Keep these short — they're typed out one at a time. */
  rotatingRoles: [
    'embedded Linux',
    'robotics test automation',
    'RTL design',
    'full-stack web',
  ],
} as const

export const links = {
  github: 'https://github.com/Vivek2998',
  linkedin: 'https://www.linkedin.com/in/vk30',
  email: 'vivekkumarkausik@gmail.com',
  twitter: 'https://x.com/Khudozhnik_29',
  instagram: 'https://instagram.com/khudozhnik_29',
} as const

export type TimelineEntry = {
  period: string
  title: string
  org?: string
  detail: string
  kind: 'work' | 'study' | 'break'
  current?: boolean
}

export const experience: TimelineEntry[] = [
  {
    period: 'Dec 2023 — Present',
    title: 'Testing Engineer',
    org: 'SS Innovations',
    kind: 'work',
    current: true,
    detail: `Testing surgical robotic systems, where a missed defect is not a bug
      report. Building and running verification for hardware-in-the-loop behaviour,
      and writing the tooling that makes regressions reproducible.`,
  },
  {
    period: 'Mar 2023 — Dec 2023',
    title: 'Software Developer',
    org: 'Opkey',
    kind: 'work',
    detail: `Worked on test-automation tooling — the first time I saw how much
      engineering sits behind "just run the tests", and what it takes to keep a
      suite trustworthy as the product underneath it moves.`,
  },
  {
    period: '2022',
    title: 'GATE preparation',
    kind: 'break',
    detail: `A year aimed at GATE. The result didn't land where I wanted it to, so I
      turned toward software instead — the electronics fundamentals came with me.`,
  },
  {
    period: '2021',
    title: 'RTL Design Engineer, Intern',
    org: 'Maven Silicon',
    kind: 'work',
    detail: `Designed a RISC-V RV32I processor block by block in Verilog HDL, and
      took it through simulation and synthesis on Xilinx Vivado. Where the interest
      in things closer to the metal started.`,
  },
]

export const education: TimelineEntry[] = [
  {
    period: '2017 — Jun 2021',
    title: 'B.E., Electronics & Communication',
    org: 'Birla Institute of Technology, Mesra',
    kind: 'study',
    detail: 'CGPA 6.98',
  },
  {
    period: '2015 — 2017',
    title: 'Intermediate, Science (Mathematics)',
    org: 'R. Lal College, Alinagar, Biharsharif',
    kind: 'study',
    detail: '63%',
  },
  {
    period: '2014',
    title: 'Matriculation, Science',
    org: 'D.A.V. Public School, P.G.C., Biharsharif',
    kind: 'study',
    detail: 'CGPA 8.8',
  },
]

export type Project = {
  name: string
  blurb: string
  detail: string
  stack: string[]
  repo?: string
  demo?: string
  /* `featured` items get the large card treatment at the top of the section. */
  featured?: boolean
  private?: boolean
  year: string
}

export const projects: Project[] = [
  {
    name: 'Aegis',
    year: '2026',
    featured: true,
    private: true,
    blurb: 'A Yocto-based embedded Linux platform for medical and robotic appliances.',
    detail: `Custom BitBake layers producing reproducible Linux images for appliances
      that have to boot the same way every time. Covers the image recipes, the
      device-side Python services, and the shell tooling that ties a build to a
      specific piece of hardware.`,
    stack: ['Yocto', 'BitBake', 'Embedded Linux', 'Python', 'Shell'],
  },
  {
    name: 'physix',
    year: '2026',
    featured: true,
    blurb: 'See physics, don’t just solve it.',
    detail: `NCERT, ICSE and CBSE physics problems for Class 9–10, each one paired
      with a live, draggable in-browser simulation. Read the solution, move a slider,
      watch the equation change. The bet: build one well-engineered simulation
      engine, and a thousand simulations become incremental.`,
    stack: ['Astro 5', 'React 19', 'TypeScript', 'Pixi.js', 'MDX'],
    repo: 'https://github.com/Vivek2998/physix',
  },
  {
    name: 'Mantra Config',
    year: '2026',
    featured: true,
    private: true,
    blurb: 'Configuration manager for a robotic application, with a real installer.',
    detail: `A desktop configuration tool for robotic systems — Python at the core,
      a TypeScript front end, and an Inno Setup installer so it ships as a signed
      Windows executable rather than a folder of scripts. Comes with its own release
      channel and a small landing site for email confirmation.`,
    stack: ['Python', 'TypeScript', 'Inno Setup', 'Batch', 'Shell'],
    repo: 'https://github.com/Vivek2998/mantra-config-installer',
  },
  {
    name: 'HRMS Platform',
    year: '2026',
    blurb: 'Human-resource management across web and mobile from one codebase.',
    detail: `A TypeScript web app with a Flutter client sharing the same backend,
      backed by PostgreSQL. Deployed on Vercel.`,
    stack: ['TypeScript', 'Flutter', 'Dart', 'PostgreSQL'],
    repo: 'https://github.com/Vivek2998/hrms-platform',
    demo: 'https://hrms-platform-web-orcin.vercel.app',
  },
  {
    name: 'RISC-V RV32I Core',
    year: '2021',
    blurb: 'A 32-bit RISC-V integer core, designed block by block in Verilog.',
    detail: `Register file, ALU, control unit and datapath written as RTL, then
      simulated and synthesised on Xilinx Vivado. Built during the Maven Silicon
      programme and the reason I still reach for a waveform viewer when something
      misbehaves.`,
    stack: ['Verilog HDL', 'VLSI', 'Xilinx Vivado'],
  },
  {
    name: 'personal_portfolio',
    year: '2023',
    blurb: 'The first version of this site, hand-written without a framework.',
    detail: `Plain HTML, CSS and JavaScript — no build step, no generator. Kept
      online as an archive, because the gap between it and what you're reading now
      is the honest version of the progress.`,
    stack: ['HTML', 'CSS', 'JavaScript', 'Bootstrap'],
    repo: 'https://github.com/Vivek2998/personal_portfolio',
    demo: 'https://vivek2998.github.io/personal_portfolio/',
  },
]

export type SkillGroup = { label: string; items: string[] }

export const skills: SkillGroup[] = [
  {
    label: 'Systems & Embedded',
    items: ['Embedded Linux', 'Yocto / BitBake', 'Linux', 'Shell', 'Verilog HDL', 'VLSI'],
  },
  {
    label: 'Languages',
    items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C / C++', 'Dart', 'SQL'],
  },
  {
    label: 'Web',
    items: ['React', 'Astro', 'Node.js', 'Tailwind CSS', 'HTML', 'CSS'],
  },
  {
    label: 'Tooling & Practice',
    items: ['Test automation', 'Git', 'Vivado', 'PostgreSQL', 'MySQL', 'Power BI'],
  },
]

export const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'journey', label: 'Journey' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const
