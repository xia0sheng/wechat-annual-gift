<template>
  <div class="big-screen">
    <h1>年会节目直播大屏</h1>
    <div class="screen-content">
      <div class="rank-section">
        <h2>火箭排行榜</h2>
        <div class="rank-list">
          <!-- 排行榜内容 -->
        </div>
      </div>

      <div class="video-section">
        <div class="video-container">
          <!-- 预留播放器容器 -->
        </div>
      </div>

      <div class="gift-section">
        <h2>实时送礼记录</h2>
        <div class="gift-list">
          <!-- 送礼记录内容 -->
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BigScreen',
  data() {
    return {
      // 后续添加数据
    }
  }
}
</script>

<style scoped>
.big-screen {
  padding: 20px;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
}

h1 {
  text-align: center;
  margin-bottom: 20px;
}

.screen-content {
  display: flex;
  gap: 20px;
  height: calc(100vh - 100px);
}

.rank-section, .gift-section {
  flex: 1;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.video-section {
  flex: 2;
  background: #000;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container {
  width: 100%;
  height: 100%;
}

.rank-list, .gift-list {
  flex: 1;
  overflow-y: auto;
}

h2 {
  margin-bottom: 15px;
  text-align: center;
}
</style> 