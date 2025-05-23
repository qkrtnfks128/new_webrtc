<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const logout = () => {
  authStore.logout()
}
</script>

<template>
  <div id="app">
    <header>
      <div class="wrapper">
        <nav>
          <RouterLink to="/">홈</RouterLink>
          <template v-if="!authStore.isLoggedIn">
            <RouterLink to="/login">로그인</RouterLink>
          </template>
          <template v-else>
            <RouterLink to="/rooms">화상회의 룸</RouterLink>
            <a href="#" @click.prevent="logout">로그아웃</a>
          </template>
        </nav>
      </div>
    </header>

    <RouterView />
  </div>
</template>

<style scoped>
header {
  background-color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

nav {
  display: flex;
  gap: 1.5rem;
}

nav a {
  color: #333;
  text-decoration: none;
  padding: 0.5rem 0;
  font-weight: 600;
  transition: color 0.2s;
}

nav a:hover {
  color: #4a6cf7;
}

nav a.router-link-active {
  color: #4a6cf7;
  border-bottom: 2px solid #4a6cf7;
}
</style>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
  line-height: 1.6;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

button {
  cursor: pointer;
  font-family: inherit;
}

a {
  color: #4a6cf7;
  text-decoration: none;
}
</style>
