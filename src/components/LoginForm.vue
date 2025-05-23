<template>
  <div class="login-form">
    <h2>로그인</h2>
    <form @submit.prevent="handleLogin">
      <div class="form-group">
        <label for="username">아이디</label>
        <input
          id="username"
          v-model="username"
          type="text"
          required
          placeholder="아이디를 입력하세요"
        />
      </div>
      <div class="form-group">
        <label for="password">비밀번호</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="비밀번호를 입력하세요"
        />
      </div>
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? '로그인 중...' : '로그인' }}
      </button>
    </form>
  </div>
</template>

<script setup lang="ts">
import { defineComponent, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const username = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const authStore = useAuthStore()
const router = useRouter()

const handleLogin = async () => {
  if (isLoading.value) return

  if (!username.value || !password.value) {
    errorMessage.value = '아이디와 비밀번호를 모두 입력해주세요.'
    return
  }

  isLoading.value = true
  errorMessage.value = ''

  try {
    const success = await authStore.login(username.value, password.value)

    if (success) {
      router.push('/rooms')
    } else {
      errorMessage.value = '로그인에 실패했습니다. 아이디와 비밀번호를 확인해주세요.'
    }
  } catch (error: any) {
    errorMessage.value = error.message || '로그인 중 오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 2rem;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h2 {
  text-align: center;
  margin-bottom: 1.5rem;
  color: #333;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #555;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

button {
  width: 100%;
  padding: 0.75rem;
  background-color: #4a6cf7;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #3a5be9;
}

button:disabled {
  background-color: #a9b7f5;
  cursor: not-allowed;
}

.error-message {
  color: #e53935;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}
</style>
