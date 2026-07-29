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

/**
 * Markers on the hero globe: places I'd like my work to end up, plus where I
 * am now.
 *
 * NVIDIA and AMD are both headquartered in Santa Clara, a couple of kilometres
 * apart — at globe scale that is the same pixel, so they share one marker
 * rather than being nudged to coordinates neither of them occupies.
 */
export type GlobePin = {
  lat: number
  lon: number
  label: string
  place: string
  /** The "you are here" marker, drawn in a different colour. */
  home?: boolean
}

export const globePins: GlobePin[] = [
  { lat: 37.37, lon: -121.98, label: 'NVIDIA · AMD', place: 'Santa Clara, USA' },
  { lat: 32.78, lon: -96.8, label: 'Texas Instruments', place: 'Dallas, USA' },
  { lat: 51.42, lon: 5.4, label: 'ASML', place: 'Veldhoven, Netherlands' },
  { lat: 28.46, lon: 77.03, label: 'Gurugram', place: 'Where I am now', home: true },
  { lat: 24.78, lon: 120.99, label: 'TSMC', place: 'Hsinchu, Taiwan' },
  { lat: 37.28, lon: 127.05, label: 'Samsung', place: 'Suwon, South Korea' },
  { lat: 35.68, lon: 139.69, label: 'Honda', place: 'Tokyo, Japan' },
]

/**
 * Where the contact form posts.
 *
 * A site on GitHub Pages is static, so it can't send mail itself — that needs a
 * third-party form endpoint. Until one is set the form still works: it composes
 * the message into a mailto: instead, so it's never a dead end.
 *
 * To switch on real delivery, paste the Formspree endpoint for the form:
 *   https://formspree.io/f/<your-form-id>
 *
 * The id is not a secret — it ships in the client bundle by design, which is
 * how every Formspree site works. Abuse is held off by their own filtering plus
 * the honeypot field in ContactForm.
 */
export const contactForm = {
  endpoint: 'https://formspree.io/f/mqernnqy',
  /** How long the success message stays before the socials come back. */
  successHoldMs: 25000,
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
  /** Shown as a small monospace chip on study entries — grade, score, etc. */
  credential?: string
}

/**
 * One spine, newest first — work, the GATE year and education all on the same
 * line rather than in parallel columns.
 *
 * Education on its own reads as filler on an engineer's portfolio, so it isn't
 * given its own section; it stays as context you pass on the way down, drawn
 * compactly while roles get the full card. The section's claim is that the path
 * wasn't a straight line, and a single interleaved timeline is what actually
 * shows that.
 */
export const journey: TimelineEntry[] = [
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
  {
    period: '2017 — Jun 2021',
    title: 'B.E., Electronics & Communication',
    org: 'Birla Institute of Technology, Mesra',
    kind: 'study',
    credential: 'CGPA 6.98',
    detail: 'Four years of signals, circuits and communication theory.',
  },
  {
    period: '2015 — 2017',
    title: 'Intermediate, Science (Mathematics)',
    org: 'R. Lal College, Alinagar, Biharsharif',
    kind: 'study',
    credential: '63%',
    detail: '',
  },
  {
    period: '2014',
    title: 'Matriculation, Science',
    org: 'D.A.V. Public School, P.G.C., Biharsharif',
    kind: 'study',
    credential: 'CGPA 8.8',
    detail: '',
  },
]

/** One of the six hues in the accent family — see `--color-hue-*` in index.css. */
export type Accent = 'teal' | 'violet' | 'amber' | 'rose' | 'azure' | 'lime'

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
  /* Tints the card's heading, border and cursor sheen. */
  accent: Accent
}

export const projects: Project[] = [
  {
    name: 'Aegis',
    accent: 'amber',
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
    accent: 'violet',
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
    accent: 'teal',
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
    accent: 'rose',
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
    accent: 'lime',
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
    accent: 'azure',
    year: '2023',
    blurb: 'The first version of this site, hand-written with no build step.',
    detail: `Plain HTML, CSS and JavaScript with Bootstrap 5 and the Argon design
      system on top — 1,100 lines in a single file, no bundler, no generator. Kept
      online as an archive, because the gap between it and what you're reading now
      is the honest version of the progress.`,
    stack: ['HTML', 'CSS', 'JavaScript', 'Bootstrap 5', 'Argon', 'jQuery', 'Swiper'],
    repo: 'https://github.com/Vivek2998/personal_portfolio',
    demo: 'https://vivek2998.github.io/personal_portfolio/',
  },
]

/**
 * The 2023-vs-2026 comparison.
 *
 * The framing is deliberate: the interesting change isn't the tooling, it's
 * knowing what to build and what to throw away. Naming the specific things the
 * old site got wrong is what makes that claim land — anyone can say they've
 * improved.
 */
export const rebuild = {
  lead: `The 2023 site is still online. Dragging between the two is the most
    honest CV I have.`,
  before: {
    year: '2023',
    caption: 'Hand-written, no build step',
    image: '/compare/2023.webp',
    alt: 'The 2023 portfolio: a plain white page with a centred heading and a large empty gap below it.',
    body: `I wrote every line of it myself — HTML, CSS and JavaScript in one
      1,100-line file, with Bootstrap 5, the Argon design system, Swiper and
      jQuery pulled in from CDNs. No bundler, no generator. It was genuinely the
      ceiling of what I could build then, and I was proud of it.`,
  },
  after: {
    year: '2026',
    caption: 'Rebuilt, with AI in the loop',
    image: '/compare/2026.webp',
    alt: 'The 2026 portfolio: a warm bone page with an interactive globe, a monospace subtitle and a structured hero.',
    body: `I move a lot faster now, and I don't pretend I did this one alone. But
      speed was never the thing that was missing.`,
  },
  note: {
    title: 'What actually changed',
    body: `For three years that old site shipped a project carousel of four blank
      slides that all linked to tutorialspoint.com, a theme toggle that threw an
      error on every single click, and a "Download CV" button that served a
      stranger's train ticket. It had been frozen on a build from November 2023
      without me noticing.`,
    punchline: `I didn't catch any of it. Noticing is the part that's mine — the
      tools only made the fixing quick.`,
  },
} as const

export type SkillGroup = {
  label: string
  items: string[]
  accent: Accent
  /** When I actually reach for this — a plain tag cloud says nothing on its own. */
  when: string
}

export const skills: SkillGroup[] = [
  {
    label: 'Systems & Embedded',
    accent: 'amber',
    when: 'When it has to boot the same way on every unit, every time.',
    items: ['Embedded Linux', 'Yocto / BitBake', 'Linux', 'Shell', 'Verilog HDL', 'VLSI'],
  },
  {
    label: 'Languages',
    accent: 'violet',
    when: 'Picked per layer — Python near the device, TypeScript near the user.',
    items: ['Python', 'TypeScript', 'JavaScript', 'Java', 'C / C++', 'Dart', 'SQL'],
  },
  {
    label: 'Web',
    accent: 'teal',
    when: 'When hardware work needs an interface someone can actually operate.',
    items: ['React', 'Astro', 'Node.js', 'Tailwind CSS', 'HTML', 'CSS'],
  },
  {
    label: 'Robotics & Motion',
    accent: 'rose',
    when: 'Picked up on the robotics side — bringing up drives and reading the bus when an axis misbehaves.',
    items: [
      'EtherCAT',
      'Actin',
      'Elmo Motion Control',
      'EC-Engineer',
      'EC-Inspector',
    ],
  },
  {
    label: 'Tooling & Practice',
    accent: 'azure',
    when: 'The unglamorous half: proving it works and keeping it that way.',
    items: ['Test automation', 'Git', 'Vivado', 'PostgreSQL', 'MySQL', 'Power BI'],
  },
]

/** Maps an accent name to its CSS variable, for inline `--accent` styling. */
export const accentVar = (accent: Accent) => `var(--color-hue-${accent})`

export const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'work', label: 'Work' },
  { id: 'rebuild', label: 'Rebuild' },
  { id: 'journey', label: 'Journey' },
  { id: 'skills', label: 'Skills' },
  { id: 'contact', label: 'Contact' },
] as const
