import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

const app = express()
app.use(cors())

const server = createServer(app)
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})

// 사용자 및 룸 관리를 위한 객체
const users = {}
const rooms = {
  roomA: {
    id: 'roomA',
    name: '화상 통화 테스트',
    participants: [],
  },
  room1: {
    id: 'room1',
    name: '비즈니스 미팅',
    participants: [],
  },
  room2: {
    id: 'room2',
    name: '팀 스크럼',
    participants: [],
  },
}

// 소켓 연결 설정
io.on('connection', (socket) => {
  console.log('클라이언트 연결됨:', socket.id)

  // 로그인 처리
  socket.on('login', (data, callback) => {
    const { username, password } = data

    // 실제 서비스에서는 데이터베이스 인증 로직이 필요합니다.
    // 여기서는 간단한 데모를 위해 모든 로그인을 허용합니다.
    const userId = `user_${Date.now()}`

    // 사용자 정보 저장
    users[userId] = {
      id: userId,
      username,
      socketId: socket.id,
    }

    socket.userId = userId

    callback({
      success: true,
      user: {
        id: userId,
        username,
      },
    })
  })

  // 룸 참가 처리
  socket.on('join-room', (data, callback) => {
    const { roomId, userId } = data

    if (!rooms[roomId]) {
      // 없는 룸이면 새로 생성
      rooms[roomId] = {
        id: roomId,
        name: `룸 ${roomId}`,
        participants: [],
      }
    }

    const room = rooms[roomId]
    const user = users[userId]

    if (!user) {
      return callback({
        success: false,
        message: '사용자를 찾을 수 없습니다.',
      })
    }

    // 사용자가 이미 룸에 있는지 확인
    const isUserInRoom = room.participants.some((p) => p.id === userId)

    if (!isUserInRoom) {
      // 룸에 사용자 추가
      room.participants.push({
        id: user.id,
        username: user.username,
      })

      // 소켓을 룸에 조인
      socket.join(roomId)

      // 사용자의 현재 룸 저장
      socket.roomId = roomId

      // 새 사용자가 참가했음을 룸의 다른 사용자들에게 알림
      socket.to(roomId).emit('user-joined', {
        id: user.id,
        username: user.username,
      })
    }

    // 참가 성공 응답
    callback({
      success: true,
      room: {
        ...room,
        participants: room.participants,
      },
    })
  })

  // 룸 나가기 처리
  socket.on('leave-room', (data, callback) => {
    const { roomId, userId } = data

    if (rooms[roomId]) {
      // 룸에서 사용자 제거
      rooms[roomId].participants = rooms[roomId].participants.filter((p) => p.id !== userId)

      // 소켓을 룸에서 분리
      socket.leave(roomId)

      // 다른 사용자들에게 알림
      socket.to(roomId).emit('user-left', userId)

      // 룸이 비어있으면 삭제 (옵션)
      if (
        rooms[roomId].participants.length === 0 &&
        !['roomA', 'room1', 'room2'].includes(roomId)
      ) {
        delete rooms[roomId]
      }
    }

    socket.roomId = null

    callback({ success: true })
  })

  // 시그널링 메시지 처리
  socket.on('signal', (data) => {
    const { type, payload, to } = data
    const fromUser = users[socket.userId]

    if (fromUser && to) {
      const toSocketId = users[to]?.socketId

      if (toSocketId) {
        // 특정 사용자에게 시그널링 메시지 전달
        io.to(toSocketId).emit('signal', {
          type,
          payload,
          from: socket.userId,
        })
      }
    }
  })

  // 연결 해제 처리
  socket.on('disconnect', () => {
    console.log('클라이언트 연결 해제:', socket.id)

    if (socket.userId && socket.roomId) {
      // 사용자가 속한 룸이 있으면 해당 룸에서 제거
      if (rooms[socket.roomId]) {
        rooms[socket.roomId].participants = rooms[socket.roomId].participants.filter(
          (p) => p.id !== socket.userId,
        )

        // 다른 사용자들에게 알림
        socket.to(socket.roomId).emit('user-left', socket.userId)

        // 룸이 비어있으면 삭제 (옵션)
        if (
          rooms[socket.roomId].participants.length === 0 &&
          !['roomA', 'room1', 'room2'].includes(socket.roomId)
        ) {
          delete rooms[socket.roomId]
        }
      }
    }

    // 사용자 정보 삭제
    if (socket.userId) {
      delete users[socket.userId]
    }
  })
})

// 서버 시작
const PORT = process.env.PORT || 3000
server.listen(PORT, () => {
  console.log(`시그널링 서버가 ${PORT} 포트에서 실행 중입니다.`)
})
