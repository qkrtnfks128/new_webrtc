<template>
  <div class="room-list">
    <h2>화상회의 룸 목록</h2>

    <div class="room-create">
      <input v-model="newRoomName" type="text" placeholder="새 룸 이름 입력" />
      <button @click="createRoom" :disabled="!newRoomName">룸 생성</button>
    </div>

    <div v-if="isLoading" class="loading">
      <p>룸 목록을 불러오는 중...</p>
    </div>

    <div v-else-if="rooms.length === 0" class="empty-list">
      <p>현재 활성화된 룸이 없습니다.</p>
    </div>

    <ul v-else class="rooms">
      <li v-for="room in rooms" :key="room.id" class="room-item">
        <div class="room-info">
          <h3>{{ room.name }}</h3>
          <p class="participant-count">참가자: {{ room.participants.length }}명</p>
        </div>
        <button @click="joinRoom(room.id)" class="join-button">참가</button>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Room } from '@/types'
import { useRoomStore } from '@/stores/room'
import { useRouter } from 'vue-router'

const rooms = ref<Room[]>([])
const isLoading = ref(true)
const newRoomName = ref('')
const roomStore = useRoomStore()
const router = useRouter()

// 데모용 가상 룸 목록
const mockRooms: Room[] = [
  {
    id: 'room1',
    name: '비즈니스 미팅',
    participants: [{ id: 'user1', username: 'Alice' }],
  },
  {
    id: 'room2',
    name: '팀 스크럼',
    participants: [
      { id: 'user2', username: 'Bob' },
      { id: 'user3', username: 'Charlie' },
    ],
  },
  {
    id: 'roomA',
    name: '화상 통화 테스트',
    participants: [],
  },
]

// 룸 목록 로드
const loadRooms = () => {
  isLoading.value = true

  // 실제 API 연동 시 여기서 데이터를 가져옵니다
  // 지금은 목업 데이터를 사용합니다
  setTimeout(() => {
    rooms.value = mockRooms
    isLoading.value = false
  }, 1000)
}

// 새 룸 생성
const createRoom = () => {
  if (!newRoomName.value) return

  const newRoom: Room = {
    id: `room${Date.now()}`,
    name: newRoomName.value,
    participants: [],
  }

  // 실제 구현에서는 서버에 데이터 전송 로직이 필요합니다
  rooms.value.push(newRoom)
  newRoomName.value = ''
}

// 룸 참가
const joinRoom = async (roomId: string) => {
  try {
    const success = await roomStore.joinRoom(roomId)

    if (success) {
      router.push(`/room/${roomId}`)
    } else {
      alert('룸 참가에 실패했습니다.')
    }
  } catch (error: any) {
    alert(`오류: ${error.message}`)
  }
}

onMounted(() => {
  loadRooms()
})
</script>

<style scoped>
.room-list {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  margin-bottom: 1.5rem;
  text-align: center;
  color: #333;
}

.room-create {
  display: flex;
  margin-bottom: 2rem;
  gap: 0.5rem;
}

.room-create input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.room-create button {
  padding: 0.75rem 1rem;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  white-space: nowrap;
}

.room-create button:hover {
  background-color: #388e3c;
}

.room-create button:disabled {
  background-color: #a5d6a7;
  cursor: not-allowed;
}

.loading,
.empty-list {
  text-align: center;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  color: #666;
}

.rooms {
  list-style: none;
  padding: 0;
  margin: 0;
}

.room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.room-info h3 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.participant-count {
  margin: 0;
  font-size: 0.875rem;
  color: #666;
}

.join-button {
  padding: 0.5rem 1rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.join-button:hover {
  background-color: #3a5be9;
}
</style>
