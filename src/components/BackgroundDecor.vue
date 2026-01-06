<template>
  <div class="fixed inset-0 pointer-events-none overflow-hidden z-0">
    <div
      v-for="i in 25"
      :key="i"
      class="star absolute animate-float-3d"
      :style="{
        left: Math.random() * 100 + '%',
        top: Math.random() * 100 + '%',
        animationDelay: Math.random() * 5 + 's',
        fontSize: Math.random() * 20 + 10 + 'px',
        opacity: Math.random() * 0.5 + 0.2,
        zIndex: Math.floor(Math.random() * 10),
        animationDuration: (Math.random() * 3 + 3) + 's',
        transformStyle: 'preserve-3d'
      }"
    >
      {{ ['✨', '⭐', '🌟', '☁️', '🎈', '💫', '🌈', '🎀'][Math.floor(Math.random() * 8)] }}
    </div>
  </div>
</template>

<style scoped>
.fixed {
  perspective: 1000px;
}

@keyframes float-3d {
  0%, 100% {
    transform: translateY(0) rotateX(0deg) rotateY(0deg) translateZ(0);
  }
  25% {
    transform: translateY(-30px) rotateX(10deg) rotateY(20deg) translateZ(50px);
  }
  50% {
    transform: translateY(-20px) rotateX(0deg) rotateY(40deg) translateZ(100px);
  }
  75% {
    transform: translateY(-40px) rotateX(-10deg) rotateY(20deg) translateZ(75px);
  }
}

.animate-float-3d {
  animation: float-3d 6s ease-in-out infinite;
  transform-style: preserve-3d;
}

.star {
  filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
  transition: transform 0.3s ease;
}
</style>
