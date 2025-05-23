import { io, Socket } from 'socket.io-client'
import type { RoomResponse, User } from '@/types'

class SignalingService {
  private socket: Socket | null = null
  private serverUrl = 'https://new-spring.onrender.com/signaling'

  // 소켓 연결 설정
  public connect(): void {
    if (!this.socket) {
      this.socket = io(this.serverUrl)
      console.log('소켓 서버에 연결 시도...')
    }
  }

  // 로그인 요청
  public login(username: string, password: string): Promise<User> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        this.connect()
      }

      if (this.socket) {
        this.socket.emit(
          'login',
          { username, password },
          (response: { success: boolean; user?: User; message?: string }) => {
            if (response.success && response.user) {
              resolve(response.user)
            } else {
              reject(new Error(response.message || '로그인 실패'))
            }
          },
        )
      } else {
        reject(new Error('소켓 연결 실패'))
      }
    })
  }

  // 룸 참가 요청
  public joinRoom(roomId: string, userId: string): Promise<RoomResponse> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('소켓 연결이 없습니다'))
        return
      }

      this.socket.emit('join-room', { roomId, userId }, (response: RoomResponse) => {
        if (response.success) {
          resolve(response)
        } else {
          reject(new Error(response.message || '룸 참가 실패'))
        }
      })
    })
  }

  // 룸 떠나기
  public leaveRoom(roomId: string, userId: string): Promise<{ success: boolean }> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('소켓 연결이 없습니다'))
        return
      }

      this.socket.emit('leave-room', { roomId, userId }, (response: { success: boolean }) => {
        resolve(response)
      })
    })
  }

  // 시그널링 메시지 전송 (offer, answer, ice candidate)
  public sendSignal(type: string, payload: any, to: string): void {
    if (!this.socket) {
      console.error('소켓 연결이 없습니다')
      return
    }

    this.socket.emit('signal', {
      type,
      payload,
      to,
    })
  }

  // 시그널링 메시지 수신을 위한 이벤트 리스너 등록
  public onSignal(callback: (data: { type: string; payload: any; from: string }) => void): void {
    if (!this.socket) {
      this.connect()
    }

    if (this.socket) {
      this.socket.on('signal', callback)
    }
  }

  // 유저 입장 이벤트 리스너
  public onUserJoined(callback: (user: User) => void): void {
    if (this.socket) {
      this.socket.on('user-joined', callback)
    }
  }

  // 유저 퇴장 이벤트 리스너
  public onUserLeft(callback: (userId: string) => void): void {
    if (this.socket) {
      this.socket.on('user-left', callback)
    }
  }

  // 연결 해제
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }
}

export default new SignalingService()
