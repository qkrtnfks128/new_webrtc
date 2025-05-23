<template>
  <div class="rooms-view">
    <RoomList />
  </div>
</template>

<script setup lang="ts">
import RoomList from '@/components/RoomList.vue'
</script>

<style scoped>
.rooms-view {
  padding: 2rem 0;
  min-height: 100vh;
  background-color: #f5f5f5;
}
</style>
