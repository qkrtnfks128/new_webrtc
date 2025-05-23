export interface User {
  id: string;
  username: string;
}

export interface Room {
  id: string;
  name: string;
  participants: User[];
}

export interface RoomResponse {
  success: boolean;
  room?: Room;
  message?: string;
}

export interface Participant {
  id: string;
  username: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
}

export interface RoomState {
  currentRoom: Room | null;
  participants: Participant[];
  localStream: MediaStream | null;
} 