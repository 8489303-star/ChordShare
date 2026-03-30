export interface SongVersion {
  name: string;
  content: string; // ChordPro format
}

export interface Song {
  id: string;
  title: string;
  artist: string;
  uploaderId: string;
  uploaderName: string;
  createdAt: any; // Firestore Timestamp
  rating: number;
  ratingCount: number;
  versions: SongVersion[];
  visible: boolean;
}

export interface UserRating {
  userId: string;
  songId: string;
  rating: number;
}
