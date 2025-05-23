import { defineStore } from 'pinia'
import type { Room, RoomState, Participant, User } from '@/types'
import SignalingService from '@/repository/SignalingService'
import WebRTCService from '@/repository/WebRTCService'
import { useAuthStore } from './auth'

export const useRoomStore = defineStore('room', {
  state: (): RoomState => ({
    currentRoom: null,
    participants: [],
    localStream: null,
  }),

  getters: {
    isInRoom: (state) => !!state.currentRoom,
    roomParticipants: (state) => state.participants,
    roomId: (state) => state.currentRoom?.id || null,
    roomName: (state) => state.currentRoom?.name || '',
  },

  actions: {
    async joinRoom(roomId: string) {
      const authStore = useAuthStore()

      if (!authStore.user) {
        throw new Error('로그인이 필요합니다')
      }

      try {
        // 로컬 미디어 스트림 가져오기
        this.localStream = await WebRTCService.getLocalStream()

        // 시그널링 서버에 룸 참가 요청
        const response = await SignalingService.joinRoom(roomId, authStore.user.id)

        if (response.success && response.room) {
          this.currentRoom = response.room

          // 초기 참가자 목록 설정
          this.participants = response.room.participants.map((user) => ({
            id: user.id,
            username: user.username,
          }))

          // 시그널링 이벤트 리스너 설정
          this.setupSignalingListeners()

          // 기존 참가자들과 연결 설정
          await this.connectWithExistingParticipants()

          return true
        }

        return false
      } catch (error) {
        console.error('룸 참가 실패:', error)
        return false
      }
    },

    async leaveRoom() {
      const authStore = useAuthStore()

      if (this.currentRoom && authStore.user) {
        try {
          await SignalingService.leaveRoom(this.currentRoom.id, authStore.user.id)

          // WebRTC 연결 종료
          WebRTCService.closeAllConnections()

          // 상태 초기화
          this.currentRoom = null
          this.participants = []
          this.localStream = null

          return true
        } catch (error) {
          console.error('룸 나가기 실패:', error)
          return false
        }
      }

      return false
    },

    async connectWithExistingParticipants() {
      const authStore = useAuthStore()

      if (!authStore.user) return

      // 현재 룸의 모든 참가자에게 Offer 생성 및 전송
      for (const participant of this.participants) {
        // 자기 자신은 제외
        if (participant.id !== authStore.user.id) {
          try {
            await WebRTCService.createAndSendOffer(participant)
          } catch (error) {
            console.error(`${participant.username}와의 연결 실패:`, error)
          }
        }
      }
    },

    setupSignalingListeners() {
      // 참가자가 룸에 참가했을 때
      SignalingService.onUserJoined((user: User) => {
        // 이미 참가자 목록에 있는지 확인
        const existingParticipant = this.participants.find((p) => p.id === user.id)

        if (!existingParticipant) {
          const newParticipant: Participant = {
            id: user.id,
            username: user.username,
          }

          this.participants.push(newParticipant)

          // 새 참가자와 연결 설정
          WebRTCService.createAndSendOffer(newParticipant).catch((error) => {
            console.error(`${user.username}와의 연결 실패:`, error)
          })
        }
      })

      // 참가자가 룸을 나갔을 때
      SignalingService.onUserLeft((userId: string) => {
        // 참가자 목록에서 제거
        this.participants = this.participants.filter((p) => p.id !== userId)

        // WebRTC 연결 종료
        WebRTCService.closeConnection(userId)
      })

      // 시그널링 메시지 수신 처리
      SignalingService.onSignal(async (data) => {
        const { type, payload, from } = data

        switch (type) {
          case 'offer':
            await WebRTCService.handleReceivedOffer(from, payload.sdp)
            break

          case 'answer':
            await WebRTCService.handleReceivedAnswer(from, payload.sdp)
            break

          case 'ice-candidate':
            await WebRTCService.handleReceivedIceCandidate(from, payload)
            break

          default:
            console.warn('알 수 없는 시그널 타입:', type)
        }
      })

      // 원격 스트림 수신 시 처리
      WebRTCService.onRemoteStream = (participantId, stream) => {
        // 해당 참가자 찾기
        const participant = this.participants.find((p) => p.id === participantId)

        if (participant) {
          // 참가자에게 스트림 할당
          participant.stream = stream
        }
      }
    },
  },
})
