import { Book, SkillRoadmap, Resource } from './types';

export const INITIAL_BOOKS: Book[] = [
  {
    bookId: "book-1",
    isbn: "978-0131103628",
    title: "The C Programming Language",
    author: ["Brian W. Kernighan", "Dennis M. Ritchie"],
    publisher: "Prentice Hall",
    publicationYear: 1988,
    description: "The classic guide to C programming, written by its creators. Widely considered the bible of system-level computer programming, introducing functions, memory structures, registers, and memory pointers.",
    genre: ["Computer Science", "Programming Systems"],
    subjectTags: ["C Language", "Memory Management", "Systems Programming"],
    coverImageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=500&auto=format&fit=crop&q=60",
    totalCopies: 4,
    availableCopies: 4,
    averageRating: 4.8,
    ratingCount: 22,
    circulationCount: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-2",
    isbn: "978-0132350884",
    title: "Clean Code: A Handbook of Agile Software Craftsmanship",
    author: ["Robert C. Martin"],
    publisher: "Prentice Hall",
    publicationYear: 2008,
    description: "Even bad code can function. But if code isn't clean, it can bring a development organization to its knees. This book teaches software designers a craftsmanship mindset regarding structural design.",
    genre: ["Software Engineering", "Agile Methodologies"],
    subjectTags: ["Clean Code", "Refactoring", "Design Patterns"],
    coverImageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&auto=format&fit=crop&q=60",
    totalCopies: 3,
    availableCopies: 3,
    averageRating: 4.7,
    ratingCount: 18,
    circulationCount: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-3",
    isbn: "978-0262033848",
    title: "Introduction to Algorithms",
    author: ["Thomas H. Cormen", "Charles E. Leiserson", "Ronald L. Rivest", "Clifford Stein"],
    publisher: "MIT Press",
    publicationYear: 2009,
    description: "The definitive reference manual for computer algorithms. Cohesive analyses of sorting, graph search, dynamic programming, greed calculations, network flow, and security crypto structures.",
    genre: ["Algorithms", "Mathematics"],
    subjectTags: ["Data Structures", "Algorithms", "MIT", "Complexity"],
    coverImageUrl: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=500&auto=format&fit=crop&q=60",
    totalCopies: 2,
    availableCopies: 2,
    averageRating: 4.9,
    ratingCount: 15,
    circulationCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-4",
    isbn: "978-0596520686",
    title: "JavaScript: The Good Parts",
    author: ["Douglas Crockford"],
    publisher: "O'Reilly Media",
    publicationYear: 2008,
    description: "Most programming languages contain good and bad parts. This book explores JavaScript's outstanding functional components, array structures, design patterns, dynamic objects, and prototypal inheritance rules.",
    genre: ["Web Development", "JavaScript Systems"],
    subjectTags: ["JavaScript", "Front-end Development", "Web Engineering"],
    coverImageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=500&auto=format&fit=crop&q=60",
    totalCopies: 5,
    availableCopies: 5,
    averageRating: 4.5,
    ratingCount: 11,
    circulationCount: 52,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-5",
    isbn: "978-0596517748",
    title: "JavaScript: The Definitive Guide",
    author: ["David Flanagan"],
    publisher: "O'Reilly Media",
    publicationYear: 2020,
    description: "Since 1996, this book has been the bible for JavaScript programmers. This edition covers ECMAScript 2020, with detailed chapters on classes, modules, iterators, generators, Promises, as well as async-await architecture.",
    genre: ["Web Development", "Programming Languages"],
    subjectTags: ["Web Standards", "JavaScript Deep Dive", "Asynchronous"],
    coverImageUrl: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=500&auto=format&fit=crop&q=60",
    totalCopies: 3,
    availableCopies: 3,
    averageRating: 4.6,
    ratingCount: 9,
    circulationCount: 20,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-6",
    isbn: "978-1491962299",
    title: "Hands-On Machine Learning with Scikit-Learn, Keras, and TensorFlow",
    author: ["Aurélien Géron"],
    publisher: "O'Reilly Media",
    publicationYear: 2019,
    description: "Through a series of recent breakthroughs, deep learning has boosted the entire field of machine learning. Learn the tools, algorithms, networks, and neural methods through complete code examples.",
    genre: ["Machine Learning", "Artificial Intelligence"],
    subjectTags: ["Neural Networks", "TensorFlow", "Scikit-Learn", "Regression"],
    coverImageUrl: "https://images.unsplash.com/photo-1527474305487-b87b222841cc?w=500&auto=format&fit=crop&q=60",
    totalCopies: 3,
    availableCopies: 3,
    averageRating: 4.9,
    ratingCount: 31,
    circulationCount: 61,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-7",
    isbn: "978-1492032649",
    title: "Designing Data-Intensive Applications",
    author: ["Martin Kleppmann"],
    publisher: "O'Reilly Media",
    publicationYear: 2017,
    description: "An exceptional architecture-level guide diving into the deep principles of database systems, replication pipelines, partitioning limits, transactions safety, batch processors, and distributed data systems.",
    genre: ["Systems Architecture", "Distributed Systems"],
    subjectTags: ["System Design", "Databases", "Scalability", "NoSQL"],
    coverImageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=500&auto=format&fit=crop&q=60",
    totalCopies: 2,
    availableCopies: 2,
    averageRating: 4.95,
    ratingCount: 40,
    circulationCount: 88,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    bookId: "book-8",
    isbn: "978-1119546436",
    title: "UI/UX Design Essentials",
    author: ["Don Norman", "Steve Krug"],
    publisher: "Wiley",
    publicationYear: 2018,
    description: "An integrated selection of human-computer interaction patterns, visual design heuristics, accessibility principles, and low-fidelity prototype design strategies.",
    genre: ["UI/UX Design", "HCI Science"],
    subjectTags: ["Wireframing", "Figma Design", "User Testing", "Layouts"],
    coverImageUrl: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?w=500&auto=format&fit=crop&q=60",
    totalCopies: 4,
    availableCopies: 4,
    averageRating: 4.7,
    ratingCount: 14,
    circulationCount: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const INITIAL_RESOURCES: Resource[] = [
  // Python Resources
  {
    resourceId: "res-py-1",
    title: "Python for Beginners - Full Video Course",
    description: "A comprehensive free 6-hour video course on YouTube covering variable structures, logic flow, conditional loops, file-operations, object architectures, and OOP paradigms in Python.",
    url: "https://www.youtube.com/watch?v=_uQrJ0TkZlc",
    type: "video",
    skills: ["Python"],
    difficulty: "beginner",
    provider: "freeCodeCamp",
    isPaid: false,
    rating: 4.8,
    upvoteCount: 154,
    downvoteCount: 2,
    isCurated: true
  },
  {
    resourceId: "res-py-2",
    title: "Official Python Documentation & Reference",
    description: "The authoritative structural syntax catalog, built-in helper functions, standard libraries, error types, and core standard manuals for the Python language.",
    url: "https://docs.python.org/3/",
    type: "documentation",
    skills: ["Python"],
    difficulty: "beginner",
    provider: "Python Software Foundation",
    isPaid: false,
    rating: 4.9,
    upvoteCount: 92,
    downvoteCount: 1,
    isCurated: true
  },
  {
    resourceId: "res-py-3",
    title: "Intermediate Python Concepts",
    description: "Master list comprehensions, decorators, generators, multi-threading, context managers, and custom error classes in Python.",
    url: "https://www.youtube.com/watch?v=HGOBQPFzWKo",
    type: "video",
    skills: ["Python"],
    difficulty: "intermediate",
    provider: "freeCodeCamp",
    isPaid: false,
    rating: 4.7,
    upvoteCount: 78,
    downvoteCount: 3,
    isCurated: true
  },
  {
    resourceId: "res-web-1",
    title: "Responsiveness Web Development & CSS Foundations",
    description: "Learn HTML5 structures, semantic components, flexbox setups, CSS grid grids, responsive layouts, media queries, and Tailwind alignments.",
    url: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    type: "course",
    skills: ["Web Development"],
    difficulty: "beginner",
    provider: "freeCodeCamp",
    isPaid: false,
    rating: 4.9,
    upvoteCount: 310,
    downvoteCount: 5,
    isCurated: true
  },
  {
    resourceId: "res-web-2",
    title: "Modern React with Vite & TypeScript",
    description: "Learn state hooks, effects, context mapping, custom loaders, type safety, modular building blocks, and rendering paradigms in modern SPA design.",
    url: "https://react.dev/reference/react",
    type: "documentation",
    skills: ["Web Development"],
    difficulty: "intermediate",
    provider: "React Team (Meta)",
    isPaid: false,
    rating: 5.0,
    upvoteCount: 220,
    downvoteCount: 0,
    isCurated: true
  },
  {
    resourceId: "res-ds-1",
    title: "Pandas and Numpy Data Operations",
    description: "Master data frames, matrices math, vector alignments, data group operations, pivot summaries, and cleaning missing data fields.",
    url: "https://www.youtube.com/watch?v=vmEHCJof1kU",
    type: "video",
    skills: ["Data Science"],
    difficulty: "beginner",
    provider: "Keith Galli",
    isPaid: false,
    rating: 4.6,
    upvoteCount: 65,
    downvoteCount: 2,
    isCurated: true
  },
  {
    resourceId: "res-ml-1",
    title: "Practical Machine Learning with Scikit-Learn",
    description: "Implement regression modeling, classification arrays, random forests, decision trees, k-means clusters, and model cross-validation score sets.",
    url: "https://scikit-learn.org/stable/tutorial/index.html",
    type: "documentation",
    skills: ["Machine Learning"],
    difficulty: "intermediate",
    provider: "Scikit-Learn Community",
    isPaid: false,
    rating: 4.8,
    upvoteCount: 95,
    downvoteCount: 1,
    isCurated: true
  }
];

export const INITIAL_ROADMAPS: SkillRoadmap[] = [
  {
    skillId: "roadmap-python",
    name: "Python Software Engineering Roadmap",
    skillName: "Python",
    description: "Master Python from foundational concepts, scripting workflows, testing matrices, to professional object-oriented and data processing levels.",
    estimatedHours: {
      beginner: 20,
      intermediate: 35,
      advanced: 45
    },
    isActive: true,
    stages: [
      {
        stageName: "Beginner",
        milestones: [
          {
            milestoneId: "py-beg-1",
            title: "Setup & Foundational Syntax",
            description: "Install Python, select code editor (VS Code), learn variables, basic input/output, standard types (str, int, float), and syntax structures.",
            learningObjectives: [
              "Install Python 3 and establish environmental pathways",
              "Execute basic mathematical expressions",
              "Read and process keyboard console input queries"
            ],
            estimatedHours: 4,
            order: 1,
            resources: ["res-py-1", "res-py-2"],
            assessment: {
              type: "quiz",
              link: "https://www.w3schools.com/python/python_quizzes.asp"
            }
          },
          {
            milestoneId: "py-beg-2",
            title: "Control Flow & Conditions",
            description: "Master logical conditionals (if-elif-else statements), relational matrices, while loops, and for loops with range variables.",
            learningObjectives: [
              "Create dynamic conditional check structures",
              "Create nested loops to loop lists arrays",
              "Understand exit codes, breaks, and skip-continues"
            ],
            estimatedHours: 6,
            order: 2,
            resources: ["res-py-1"],
            assessment: {
              type: "project",
              link: "https://github.com/topics/python-beginner-projects"
            }
          },
          {
            milestoneId: "py-beg-3",
            title: "Lists, Dicts & Functions",
            description: "Master lists key elements, tuple read-only parameters, key-value dictionary systems, and user defined reusable functional blocks.",
            learningObjectives: [
              "Manipulate list values (append, insert, pop, slice)",
              "Loop key pairs inside a JSON map dictionary",
              "Pass positional arguments and keyword defaults into functions"
            ],
            estimatedHours: 10,
            order: 3,
            resources: ["res-py-1", "res-py-2"]
          }
        ]
      },
      {
        stageName: "Intermediate",
        milestones: [
          {
            milestoneId: "py-int-1",
            title: "Object-Oriented Programming (OOP)",
            description: "Learn classes, constructor binders, variable states, method overrides, properties, class methods, and subclass inheritance hierarchies.",
            learningObjectives: [
              "Instantiate abstract data structures inside custom layout classes",
              "Implement encapsulation using private property underscores",
              "Execute overrides on default class mathematical operators"
            ],
            estimatedHours: 12,
            order: 1,
            resources: ["res-py-3"]
          },
          {
            milestoneId: "py-int-2",
            title: "File Operations & IO Error Guards",
            description: "Learn safe local input/output (open/with), JSON serialization, folder navigation, and robust try-except-finally validation guards.",
            learningObjectives: [
              "Safely parse local text and CSV spreadsheets",
              "Enforce strict try-except statements with logging lines",
              "Serialize structured data classes into clean JSON formats"
            ],
            estimatedHours: 12,
            order: 2,
            resources: ["res-py-2", "res-py-3"]
          }
        ]
      },
      {
        stageName: "Advanced",
        milestones: [
          {
            milestoneId: "py-adv-1",
            title: "Advanced Scoping, Decorators & Concurrency",
            description: "Unlock advanced runtime parameters, custom function decorators, closure variables, process threads, and modern coroutines (async/await) protocols.",
            learningObjectives: [
              "Design custom audit metrics decorators for functions",
              "Manage asynchronous thread pools safely",
              "Debug dynamic variable local/global scoping errors"
            ],
            estimatedHours: 15,
            order: 1,
            resources: ["res-py-2"]
          }
        ]
      }
    ]
  },
  {
    skillId: "roadmap-web",
    name: "Full-Stack Web Development Roadmap",
    skillName: "Web Development",
    description: "Learn modular semantic layout design, reactive state engineering, responsive alignments, and modern componentized programming standards.",
    estimatedHours: {
      beginner: 25,
      intermediate: 40,
      advanced: 60
    },
    isActive: true,
    stages: [
      {
        stageName: "Beginner",
        milestones: [
          {
            milestoneId: "web-beg-1",
            title: "HTML5 Semantic Tags & CSS3 Layouts",
            description: "Establish responsive UI templates. Learn article structures, grid lists, Flexbox controls, box styling, margins alignment, and text design settings.",
            learningObjectives: [
              "Build fully semantically accessible landing pages",
              "Implement fluid media sizes adaptable to screens",
              "Position complex cards using flex blocks"
            ],
            estimatedHours: 10,
            order: 1,
            resources: ["res-web-1"],
            assessment: {
              type: "project",
              link: "https://codepen.io/"
            }
          }
        ]
      },
      {
        stageName: "Intermediate",
        milestones: [
          {
            milestoneId: "web-int-1",
            title: "Modular App Components with React",
            description: "Ditch static code. Master modular reactive layouts using React hooks, JSX rendering rules, and TypeScript validation.",
            learningObjectives: [
              "Track active form states cleanly without side effects",
              "Perform fetch integrations with APIs using standard async wrappers",
              "Optimize bundle load by managing modular exports"
            ],
            estimatedHours: 18,
            order: 1,
            resources: ["res-web-2"]
          }
        ]
      },
      {
        stageName: "Advanced",
        milestones: []
      }
    ]
  }
];
