import SignalingService from './SignalingService'
import type { Participant } from '@/types'

class WebRTCService {
  private peerConnections: Map<string, RTCPeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  }

  // 로컬 미디어 스트림 가져오기
  public async getLocalStream(): Promise<MediaStream> {
    if (this.localStream) {
      return this.localStream
    }

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      })
      return this.localStream
    } catch (error) {
      console.error('로컬 미디어 스트림을 가져오는데 실패했습니다:', error)
      throw error
    }
  }

  // 특정 참가자와 WebRTC 연결 생성
  public async createPeerConnection(participant: Participant): Promise<RTCPeerConnection> {
    if (this.peerConnections.has(participant.id)) {
      return this.peerConnections.get(participant.id)!
    }

    try {
      // 로컬 스트림이 없으면 가져오기
      if (!this.localStream) {
        await this.getLocalStream()
      }

      // RTCPeerConnection 생성
      const peerConnection = new RTCPeerConnection(this.rtcConfig)

      // 로컬 스트림의 모든 트랙을 피어 커넥션에 추가
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          if (this.localStream) {
            peerConnection.addTrack(track, this.localStream)
          }
        })
      }

      // ICE 후보 이벤트 처리
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          SignalingService.sendSignal('ice-candidate', event.candidate, participant.id)
        }
      }

      // 원격 스트림 이벤트 처리
      peerConnection.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          this.handleRemoteStream(participant.id, event.streams[0])
        }
      }

      // 연결 상태 변경 이벤트 처리
      peerConnection.onconnectionstatechange = () => {
        console.log(`${participant.id}와의 연결 상태: ${peerConnection.connectionState}`)
      }

      // 연결 저장
      this.peerConnections.set(participant.id, peerConnection)
      return peerConnection
    } catch (error) {
      console.error('피어 커넥션 생성 실패:', error)
      throw error
    }
  }

  // 원격 스트림 처리
  private handleRemoteStream(participantId: string, stream: MediaStream): void {
    // 이 메서드는 외부에서 콜백을 등록하여 사용합니다.
    // 예: webRTCService.onRemoteStream = (participantId, stream) => { ... }
    if (this.onRemoteStream) {
      this.onRemoteStream(participantId, stream)
    }
  }

  // 원격 스트림 이벤트 콜백
  public onRemoteStream: ((participantId: string, stream: MediaStream) => void) | null = null

  // Offer 생성 및 전송
  public async createAndSendOffer(participant: Participant): Promise<void> {
    try {
      const peerConnection = await this.createPeerConnection(participant)
      const offer = await peerConnection.createOffer()
      await peerConnection.setLocalDescription(offer)

      // 시그널링 서버를 통해 offer 전송
      SignalingService.sendSignal(
        'offer',
        {
          sdp: peerConnection.localDescription,
        },
        participant.id,
      )
    } catch (error) {
      console.error('Offer 생성 및 전송 실패:', error)
      throw error
    }
  }

  // Answer 생성 및 전송
  public async handleReceivedOffer(from: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    try {
      // 상대방을 찾거나 생성
      const participant: Participant = {
        id: from,
        username: from, // 임시로 id를 username으로 설정
      }

      const peerConnection = await this.createPeerConnection(participant)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))

      const answer = await peerConnection.createAnswer()
      await peerConnection.setLocalDescription(answer)

      // 시그널링 서버를 통해 answer 전송
      SignalingService.sendSignal(
        'answer',
        {
          sdp: peerConnection.localDescription,
        },
        from,
      )
    } catch (error) {
      console.error('Offer 처리 및 Answer 전송 실패:', error)
      throw error
    }
  }

  // Answer 처리
  public async handleReceivedAnswer(from: string, sdp: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(from)
      if (peerConnection) {
        await peerConnection.setRemoteDescription(new RTCSessionDescription(sdp))
      } else {
        console.error(`${from}에 대한 피어 연결이 없습니다.`)
      }
    } catch (error) {
      console.error('Answer 처리 실패:', error)
      throw error
    }
  }

  // ICE Candidate 처리
  public async handleReceivedIceCandidate(
    from: string,
    candidate: RTCIceCandidateInit,
  ): Promise<void> {
    try {
      const peerConnection = this.peerConnections.get(from)
      if (peerConnection) {
        await peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      } else {
        console.error(`${from}에 대한 피어 연결이 없습니다.`)
      }
    } catch (error) {
      console.error('ICE Candidate 처리 실패:', error)
      throw error
    }
  }

  // 모든 연결 종료
  public closeAllConnections(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    this.peerConnections.forEach((connection, key) => {
      connection.close()
    })

    this.peerConnections.clear()
  }

  // 특정 참가자와의 연결 종료
  public closeConnection(participantId: string): void {
    const connection = this.peerConnections.get(participantId)
    if (connection) {
      connection.close()
      this.peerConnections.delete(participantId)
    }
  }
}

export default new WebRTCService()
