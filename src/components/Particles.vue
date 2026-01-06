<template>
  <div class="fixed inset-0 pointer-events-none z-[9999]">
    <div
      v-for="p in particles"
      :key="p.id"
      class="absolute text-2xl"
      :style="{
        left: p.x + 'px',
        top: p.y + 'px',
        opacity: p.opacity,
        transform: `scale(${p.scale})`,
      }"
    >
      {{ p.emoji }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";

const particles = ref([]);

const generateId = () => Date.now() + Math.random().toString(36).substr(2, 9);

const triggerBurst = (x, y) => {
  const emojis = ["✨", "⭐", "🌟", "💖", "🌈", "🎈"];
  for (let i = 0; i < 12; i++) {
    const id = generateId();
    particles.value.push({
      id,
      x,
      y,
      emoji: emojis[Math.floor(Math.random() * emojis.length)],
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 5,
      opacity: 1,
      scale: 1,
    });

    setTimeout(() => {
      particles.value = particles.value.filter((p) => p.id !== id);
    }, 1000);
  }
};

const updateParticles = () => {
  particles.value.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.opacity -= 0.02;
    p.scale -= 0.01;
  });
  if (particles.value.length > 0) {
    requestAnimationFrame(updateParticles);
  }
};

watch(
  () => particles.value.length,
  (newLen, oldLen) => {
    if (newLen > 0 && oldLen === 0) {
      updateParticles();
    }
  }
);

defineExpose({
  triggerBurst,
});
</script>
