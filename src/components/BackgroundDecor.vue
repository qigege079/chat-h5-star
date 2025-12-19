<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div
      v-for="i in 15"
      :key="i"
      class="star absolute animate-float"
      :style="{
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        fontSize: Math.random() * 20 + 10 + 'px',
        opacity: Math.random() * 0.5 + 0.2
      }"
    >
      {{ ['✨', '⭐', '🌟', '☁️', '🎈'][Math.floor(Math.random() * 5)] }}
    </div>
  </div>
</template>

<style scoped>
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.star {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}
</style>
