export interface Review {
  id: string;
  name: string;
  rating: number;
  date: string;
  comment: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  experience: number;
  hospital: string;
  rating: number;
  reviewsCount: number;
  fee: number;
  availability: 'today' | 'tomorrow' | 'day_after';
  languages: string[];
  education: string[];
  awards: string[];
  about: string;
  reviews: Review[];
  image: string;
}

export const doctors: Doctor[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    specialization: 'Gynecologist',
    experience: 12,
    hospital: 'Apollo Hospital, Hyderabad',
    rating: 4.9,
    reviewsCount: 150,
    fee: 800,
    availability: 'today',
    languages: ['English', 'Hindi', 'Telugu'],
    education: ['MBBS - Osmania Medical College', 'MD - Obstetrics & Gynaecology'],
    awards: ['Best Gynecologist Award 2021', 'Excellence in Women Healthcare'],
    about: 'Dr. Priya Sharma is a highly experienced Gynecologist with a passion for providing comprehensive care to women of all ages. She specializes in high-risk pregnancies and infertility treatments.',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'A. Rao', rating: 5, date: '2023-10-15', comment: 'Very patient and understanding doctor.' },
      { id: '2', name: 'S. K.', rating: 4.5, date: '2023-09-20', comment: 'Great experience, highly recommend.' },
      { id: '3', name: 'M. Patel', rating: 5, date: '2023-08-05', comment: 'She made me feel very comfortable.' }
    ]
  },
  {
    id: '2',
    name: 'Rajesh Kumar',
    specialization: 'Cardiologist',
    experience: 18,
    hospital: 'KIMS Hospital, Hyderabad',
    rating: 4.8,
    reviewsCount: 210,
    fee: 1000,
    availability: 'today',
    languages: ['English', 'Hindi', 'Telugu'],
    education: ['MBBS - Gandhi Medical College', 'DM - Cardiology'],
    awards: ['Top Cardiologist 2022'],
    about: 'Dr. Rajesh Kumar is a renowned Cardiologist specializing in interventional cardiology and preventive heart care. He has successfully performed over 5000 angioplasties.',
    image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'K. Reddy', rating: 5, date: '2023-10-10', comment: 'Saved my father\'s life. Excellent doctor.' },
      { id: '2', name: 'V. Singh', rating: 4, date: '2023-09-15', comment: 'Good doctor but waiting time was long.' }
    ]
  },
  {
    id: '3',
    name: 'Anitha Reddy',
    specialization: 'Dermatologist',
    experience: 8,
    hospital: 'Yashoda Hospital, Hyderabad',
    rating: 4.7,
    reviewsCount: 95,
    fee: 600,
    availability: 'tomorrow',
    languages: ['English', 'Telugu'],
    education: ['MBBS', 'MD - Dermatology'],
    awards: ['Young Dermatologist of the Year'],
    about: 'Dr. Anitha Reddy offers advanced treatments for skin, hair, and nail disorders. She is known for her expertise in cosmetic dermatology and laser treatments.',
    image: 'https://images.unsplash.com/photo-1594824436998-d40134f2d765?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'P. Jain', rating: 5, date: '2023-10-01', comment: 'My acne cleared up completely within a month.' },
      { id: '2', name: 'N. V.', rating: 4.5, date: '2023-08-25', comment: 'Very professional and effective treatment.' }
    ]
  },
  {
    id: '4',
    name: 'Suresh Patel',
    specialization: 'General Physician',
    experience: 15,
    hospital: 'Care Hospital, Hyderabad',
    rating: 4.6,
    reviewsCount: 180,
    fee: 400,
    availability: 'today',
    languages: ['English', 'Hindi', 'Gujarati'],
    education: ['MBBS', 'MD - General Medicine'],
    awards: [],
    about: 'Dr. Suresh Patel is a trusted General Physician with extensive experience in diagnosing and treating a wide range of common illnesses and chronic conditions.',
    image: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'R. K.', rating: 4.5, date: '2023-09-05', comment: 'Accurate diagnosis and quick recovery.' },
      { id: '2', name: 'T. M.', rating: 5, date: '2023-07-12', comment: 'Always available for his patients.' }
    ]
  },
  {
    id: '5',
    name: 'Meena Iyer',
    specialization: 'Pediatrician',
    experience: 10,
    hospital: 'Rainbow Hospital, Hyderabad',
    rating: 4.9,
    reviewsCount: 250,
    fee: 700,
    availability: 'today',
    languages: ['English', 'Hindi', 'Tamil'],
    education: ['MBBS', 'MD - Pediatrics'],
    awards: ['Best Pediatrician 2020'],
    about: 'Dr. Meena Iyer is a compassionate pediatrician dedicated to providing the best possible care for children from newborns to adolescents.',
    image: 'https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'S. N.', rating: 5, date: '2023-10-20', comment: 'My kids love her. She is very gentle.' },
      { id: '2', name: 'A. B.', rating: 5, date: '2023-09-10', comment: 'Answers all questions patiently.' }
    ]
  },
  {
    id: '6',
    name: 'Vikram Singh',
    specialization: 'Orthopedic',
    experience: 20,
    hospital: 'Continental Hospital, Hyderabad',
    rating: 4.8,
    reviewsCount: 140,
    fee: 900,
    availability: 'tomorrow',
    languages: ['English', 'Hindi'],
    education: ['MBBS', 'MS - Orthopaedics'],
    awards: ['Excellence in Joint Replacement'],
    about: 'Dr. Vikram Singh is a senior Orthopedic surgeon specializing in joint replacement, arthroscopy, and sports injuries.',
    image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'D. C.', rating: 5, date: '2023-08-15', comment: 'Successful knee surgery. Walking perfectly now.' }
    ]
  },
  {
    id: '7',
    name: 'Kavitha Nair',
    specialization: 'Psychiatrist',
    experience: 9,
    hospital: 'Aster Hospital, Hyderabad',
    rating: 4.7,
    reviewsCount: 85,
    fee: 1200,
    availability: 'today',
    languages: ['English', 'Malayalam', 'Hindi'],
    education: ['MBBS', 'MD - Psychiatry'],
    awards: [],
    about: 'Dr. Kavitha Nair provides evidence-based treatment for mental health disorders, including anxiety, depression, and bipolar disorder, with a holistic approach.',
    image: 'https://images.unsplash.com/photo-1527613426441-4da17471b66d?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'Anonymous', rating: 5, date: '2023-09-30', comment: 'Helped me overcome my severe anxiety.' },
      { id: '2', name: 'Anonymous', rating: 4.5, date: '2023-07-20', comment: 'Very empathetic and understanding.' }
    ]
  },
  {
    id: '8',
    name: 'Arun Menon',
    specialization: 'Neurologist',
    experience: 14,
    hospital: 'Sunshine Hospital, Hyderabad',
    rating: 4.8,
    reviewsCount: 110,
    fee: 1100,
    availability: 'day_after',
    languages: ['English', 'Telugu', 'Malayalam'],
    education: ['MBBS', 'DM - Neurology'],
    awards: ['Best Neurologist Award'],
    about: 'Dr. Arun Menon is a highly skilled Neurologist with expertise in treating complex neurological disorders, including stroke, epilepsy, and Parkinson\'s disease.',
    image: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&q=80&w=200&h=200',
    reviews: [
      { id: '1', name: 'B. S.', rating: 5, date: '2023-10-05', comment: 'Excellent doctor, explains things clearly.' }
    ]
  }
];
