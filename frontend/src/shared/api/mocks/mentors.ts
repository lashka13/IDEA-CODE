export interface Mentor {
  id: string;
  name: string;
  avatarUrl: string;
  title: string;
  company: string;
  experience: string;
  bio: string;
  techStack: string[];
  rating: number;
  reviewCount: number;
  sessionsCompleted: number;
  pricePerHour: number;
  available: boolean;
  specializations: string[];
  languages: string[];
}

export const mockMentors: Mentor[] = [
  {
    id: 'mentor-1',
    name: 'Алексей Козлов',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&q=80',
    title: 'Senior Frontend Engineer',
    company: 'T-Bank',
    experience: '6 лет',
    bio: 'Веду фронтенд команду из 8 человек. Экспертиза в React, performance optimization и design systems. Помогу подготовиться к собеседованию в FAANG/Big Tech.',
    techStack: ['React', 'TypeScript', 'Next.js', 'GraphQL', 'Webpack'],
    rating: 4.9,
    reviewCount: 87,
    sessionsCompleted: 234,
    pricePerHour: 80,
    available: true,
    specializations: ['Frontend', 'React', 'Подготовка к собеседованиям'],
    languages: ['JavaScript', 'TypeScript'],
  },
  {
    id: 'mentor-2',
    name: 'Мария Сидорова',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&q=80',
    title: 'ML Engineer',
    company: 'Яндекс',
    experience: '5 лет',
    bio: 'Занимаюсь NLP и компьютерным зрением. Публикации на NeurIPS и ICML. Помогу с проектами по ML, подготовкой к собесам в DS и написанием научных статей.',
    techStack: ['PyTorch', 'TensorFlow', 'Python', 'Pandas', 'HuggingFace'],
    rating: 4.8,
    reviewCount: 64,
    sessionsCompleted: 156,
    pricePerHour: 100,
    available: true,
    specializations: ['Machine Learning', 'NLP', 'Computer Vision'],
    languages: ['Python', 'SQL'],
  },
  {
    id: 'mentor-3',
    name: 'Дмитрий Волков',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&q=80',
    title: 'DevOps Lead',
    company: 'VK',
    experience: '8 лет',
    bio: 'Строю CI/CD пайплайны и инфраструктуру на AWS/GCP. Certified Kubernetes Administrator. Научу деплоить как в продакшне.',
    techStack: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'GitHub Actions'],
    rating: 4.9,
    reviewCount: 45,
    sessionsCompleted: 112,
    pricePerHour: 90,
    available: true,
    specializations: ['DevOps', 'Kubernetes', 'Cloud Architecture'],
    languages: ['Go', 'Bash', 'Python'],
  },
  {
    id: 'mentor-4',
    name: 'Анна Петрова',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&q=80',
    title: 'Senior Backend Engineer',
    company: 'Kaspersky',
    experience: '7 лет',
    bio: 'Проектирую высоконагруженные микросервисы на Go и Java. Опыт с event-driven архитектурой (Kafka), gRPC, и проектированием API.',
    techStack: ['Go', 'Java', 'PostgreSQL', 'Kafka', 'gRPC'],
    rating: 4.7,
    reviewCount: 38,
    sessionsCompleted: 89,
    pricePerHour: 85,
    available: false,
    specializations: ['Backend', 'System Design', 'Микросервисы'],
    languages: ['Go', 'Java', 'SQL'],
  },
  {
    id: 'mentor-5',
    name: 'Кирилл Новиков',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&q=80',
    title: 'iOS Lead',
    company: 'Авито',
    experience: '6 лет',
    bio: 'Разрабатываю iOS-приложения с 2 миллионами DAU. Эксперт в SwiftUI, Combine и модульной архитектуре. Менторю начинающих iOS разработчиков.',
    techStack: ['Swift', 'SwiftUI', 'Combine', 'UIKit', 'Core Data'],
    rating: 4.8,
    reviewCount: 52,
    sessionsCompleted: 134,
    pricePerHour: 75,
    available: true,
    specializations: ['iOS', 'Mobile', 'Swift'],
    languages: ['Swift', 'Objective-C'],
  },
  {
    id: 'mentor-6',
    name: 'Елена Смирнова',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&q=80',
    title: 'Security Engineer',
    company: 'Positive Technologies',
    experience: '5 лет',
    bio: 'Занимаюсь пентестом веб-приложений и аудитом безопасности. Призёр CTF-соревнований. Помогу подготовиться к CTF и получить сертификацию CEH.',
    techStack: ['Burp Suite', 'Metasploit', 'Python', 'Linux', 'Wireshark'],
    rating: 4.9,
    reviewCount: 29,
    sessionsCompleted: 67,
    pricePerHour: 95,
    available: true,
    specializations: ['CyberSec', 'Пентест', 'CTF'],
    languages: ['Python', 'Bash', 'C'],
  },
];
