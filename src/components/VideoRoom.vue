<template>
  <div class="video-room">
    <div class="room-header">
      <h2>{{ roomName }}</h2>
      <div class="controls">
        <button class="audio-toggle" :class="{ muted: audioMuted }" @click="toggleAudio">
          {{ audioMuted ? '음소거 해제' : '음소거' }}
        </button>
        <button class="video-toggle" :class="{ muted: videoMuted }" @click="toggleVideo">
          {{ videoMuted ? '비디오 켜기' : '비디오 끄기' }}
        </button>
        <button class="leave-button" @click="leaveRoom">나가기</button>
      </div>
    </div>

    <div class="video-grid" :class="`grid-${videoCount}`">
      <!-- 로컬 비디오 -->
      <div class="video-container local-video">
        <video ref="localVideo" muted autoplay playsinline></video>
        <div class="participant-name">나 ({{ username }})</div>
      </div>

      <!-- 원격 참가자 비디오 -->
      <div
        v-for="participant in participants"
        :key="participant.id"
        class="video-container remote-video"
      >
        <video :ref="(el) => addVideoRef(participant.id, el)" autoplay playsinline></video>
        <div class="participant-name">{{ participant.username }}</div>
      </div>
    </div>

    <div class="chat-container">
      <div class="chat-messages">
        <div v-for="(message, index) in chatMessages" :key="index" class="message">
          <strong>{{ message.sender }}:</strong> {{ message.text }}
        </div>
      </div>
      <div class="chat-input">
        <input v-model="chatInput" @keyup.enter="sendChatMessage" placeholder="메시지 입력..." />
        <button @click="sendChatMessage">전송</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Participant } from '@/types'
import { useRoomStore } from '@/stores/room'
import { useAuthStore } from '@/stores/auth'
import WebRTCService from '@/repository/WebRTCService'

const route = useRoute()
const router = useRouter()
const roomStore = useRoomStore()
const authStore = useAuthStore()

const localVideo = ref<HTMLVideoElement | null>(null)
const videoRefs = ref<{ [key: string]: HTMLVideoElement }>({})
const audioMuted = ref(false)
const videoMuted = ref(false)
const chatInput = ref('')
const chatMessages = ref<{ sender: string; text: string }[]>([])

// 사용자명과 로컬 스트림 가져오기
const username = computed(() => authStore.user?.username || '')
const localStream = computed(() => roomStore.localStream)

// 참가자 목록
const participants = computed<Participant[]>(() => {
  return roomStore.participants.filter((p) => p.id !== authStore.user?.id)
})

// 비디오 그리드 크기 조정을 위한 계산
const videoCount = computed(() => participants.value.length + 1)

// 룸 이름
const roomName = computed(() => roomStore.roomName || '화상 회의')

// 비디오 요소 참조 추가
const addVideoRef = (id: string, el: HTMLVideoElement | null) => {
  if (el) {
    videoRefs.value[id] = el
  }
}

// 오디오 토글
const toggleAudio = () => {
  if (localStream.value) {
    const audioTracks = localStream.value.getAudioTracks()
    if (audioTracks.length > 0) {
      audioTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      audioMuted.value = !audioTracks[0].enabled
    }
  }
}

// 비디오 토글
const toggleVideo = () => {
  if (localStream.value) {
    const videoTracks = localStream.value.getVideoTracks()
    if (videoTracks.length > 0) {
      videoTracks.forEach((track) => {
        track.enabled = !track.enabled
      })
      videoMuted.value = !videoTracks[0].enabled
    }
  }
}

// 채팅 메시지 전송 (데모용, 실제로는 시그널링 서버 통해 구현)
const sendChatMessage = () => {
  if (!chatInput.value.trim()) return

  chatMessages.value.push({
    sender: username.value,
    text: chatInput.value,
  })

  chatInput.value = ''

  // 실제 구현에서는 여기서 메시지를 시그널링 서버로 전송합니다
}

// 룸 나가기
const leaveRoom = async () => {
  await roomStore.leaveRoom()
  router.push('/rooms')
}

// 원격 스트림 처리 콜백
const handleRemoteStream = (participantId: string, stream: MediaStream) => {
  // 다음 tick에서 DOM 업데이트 후 비디오 요소 설정
  setTimeout(() => {
    const videoEl = videoRefs.value[participantId]
    if (videoEl && stream) {
      videoEl.srcObject = stream
    }
  }, 0)
}

onMounted(async () => {
  const roomId = route.params.id as string

  if (!roomId) {
    router.push('/rooms')
    return
  }

  if (!authStore.isLoggedIn) {
    router.push('/login')
    return
  }

  // 이미 룸에 참가한 상태인지 확인하고, 아니면 참가 시도
  if (!roomStore.isInRoom || roomStore.roomId !== roomId) {
    try {
      const success = await roomStore.joinRoom(roomId)
      if (!success) {
        alert('룸 참가에 실패했습니다.')
        router.push('/rooms')
        return
      }
    } catch (error: any) {
      alert(`오류: ${error.message}`)
      router.push('/rooms')
      return
    }
  }

  // WebRTC 원격 스트림 처리 콜백 설정
  WebRTCService.onRemoteStream = handleRemoteStream

  // 로컬 비디오 설정
  if (localVideo.value && localStream.value) {
    localVideo.value.srcObject = localStream.value
  }
})

// 참가자의 원격 스트림이 변경될 때 비디오 요소 업데이트
watchEffect(() => {
  participants.value.forEach((participant) => {
    if (participant.stream) {
      const videoEl = videoRefs.value[participant.id]
      if (videoEl && !videoEl.srcObject) {
        videoEl.srcObject = participant.stream
      }
    }
  })
})

// 컴포넌트 정리
onBeforeUnmount(() => {
  WebRTCService.onRemoteStream = null
})
</script>

<style scoped>
.video-room {
  display: grid;
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  height: 100vh;
  overflow: hidden;
}

.room-header {
  grid-column: 1 / 3;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-bottom: 1px solid #eee;
}

.room-header h2 {
  margin: 0;
  font-size: 1.5rem;
}

.controls {
  display: flex;
  gap: 0.5rem;
}

.controls button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.audio-toggle,
.video-toggle {
  background-color: #4a6cf7;
  color: white;
}

.audio-toggle.muted,
.video-toggle.muted {
  background-color: #f44336;
}

.leave-button {
  background-color: #f44336;
  color: white;
}

.video-grid {
  grid-column: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  grid-auto-rows: 1fr;
  gap: 1rem;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f0f0f0;
}

.video-grid.grid-1 {
  grid-template-columns: 1fr;
}

.video-grid.grid-2 {
  grid-template-columns: repeat(2, 1fr);
}

.video-grid.grid-3,
.video-grid.grid-4 {
  grid-template-columns: repeat(2, 1fr);
}

.video-grid.grid-5,
.video-grid.grid-6 {
  grid-template-columns: repeat(3, 1fr);
}

.video-container {
  position: relative;
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  aspect-ratio: 16 / 9;
}

.video-container video {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.participant-name {
  position: absolute;
  bottom: 0.5rem;
  left: 0.5rem;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.chat-container {
  grid-column: 2;
  display: flex;
  flex-direction: column;
  background-color: white;
  border-left: 1px solid #eee;
}

.chat-messages {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.message {
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.chat-input {
  display: flex;
  padding: 0.5rem;
  border-top: 1px solid #eee;
}

.chat-input input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-size: 0.875rem;
}

.chat-input button {
  padding: 0.5rem 1rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .video-room {
    grid-template-columns: 1fr;
    grid-template-rows: auto 1fr auto;
  }

  .room-header {
    grid-column: 1;
  }

  .video-grid {
    grid-column: 1;
    max-height: 60vh;
  }

  .chat-container {
    grid-column: 1;
    height: 40vh;
  }
}
</style>
