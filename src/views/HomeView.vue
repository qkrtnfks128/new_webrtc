<template>
  <main>
    <div class="home">
      <h1>WebRTC 화상회의</h1>
      <p class="description">
        사용자 인증 후 화상회의 룸에 참가하여 다른 사용자들과 화상 통화를 할 수 있습니다.
      </p>

      <div class="actions">
        <RouterLink to="/login" class="btn login-btn">로그인</RouterLink>
        <RouterLink to="/rooms" class="btn rooms-btn">회의 룸 목록</RouterLink>
      </div>
    </div>
  </main>
</template>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  color: #333;
}

.description {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: background-color 0.2s;
}

.login-btn {
  background-color: #4a6cf7;
  color: white;
}

.login-btn:hover {
  background-color: #3a5be9;
}

.rooms-btn {
  background-color: #4caf50;
  color: white;
}

.rooms-btn:hover {
  background-color: #388e3c;
}
</style>
