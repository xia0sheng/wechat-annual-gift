<template>
  <div class="big-screen" ref="bigScreen">
    <div class="header-container">
      <h1>年会节目直播大屏</h1>
      <el-button 
        size="small" 
        type="primary" 
        @click="toggleFullscreen"
        class="fullscreen-btn"
      >
        {{ isFullscreen ? '退出全屏' : '全屏显示' }}
      </el-button>
    </div>
    <div class="screen-content">
      <div class="rank-section">
        <h2>火箭排行榜</h2>
        <div class="rank-list">
          <div v-for="(item, index) in rankList" :key="index" class="rank-item">
            <span class="rank-num">{{ index + 1 }}</span>
            <span class="program-name">{{ item.programName }}</span>
            <span class="rocket-count">🚀 × {{ item.rocketCount }}</span>
          </div>
        </div>
      </div>

      <div class="video-section">
        <div class="video-container">
          <video
            ref="videoPlayer"
            class="video-player"
            :class="{ 'full-height': !showPlaylist }"
            :src="currentVideo"
            controls
            @ended="handleVideoEnd"
          ></video>
          
          <div class="danmaku-layer" v-show="currentVideo">
            <div class="gift-effect-area" ref="giftEffectArea">
              <!-- 礼物特效将在这里动态生成 -->
            </div>
            <div class="danmaku-area" ref="danmakuArea">
              <!-- 弹幕将在这里动态生成 -->
            </div>
          </div>

          <div class="video-controls" v-show="showPlaylist">
            <div class="playlist-header">
              <h3>播放列表</h3>
              <div>
                <input
                  type="file"
                  ref="fileInput"
                  accept="video/*"
                  multiple
                  @change="handleFileSelect"
                  style="display: none"
                >
                <el-button size="small" @click="$refs.fileInput.click()">
                  添加视频
                </el-button>
              </div>
            </div>
            
            <div class="playlist">
              <div
                v-for="(video, index) in playlist"
                :key="index"
                class="playlist-item"
                :class="{ active: currentVideoIndex === index }"
                @click="playVideo(index)"
              >
                <span class="video-name">{{ video.name }}</span>
                <el-button
                  size="small"
                  type="danger"
                  @click.stop="removeVideo(index)"
                >
                  删除
                </el-button>
              </div>
            </div>
            
            <div class="video-controls-buttons">
              <el-button @click="playPrevious" :disabled="!hasPrevious">
                上一个
              </el-button>
              <el-button @click="toggleLoop" :type="isLooping ? 'success' : 'default'">
                {{ isLooping ? '循环开' : '循环关' }}
              </el-button>
              <el-button @click="playNext" :disabled="!hasNext">
                下一个
              </el-button>
              <el-button 
                type="warning" 
                @click="testEffects"
                v-if="currentVideo"
              >
                测试特效
              </el-button>
            </div>
          </div>

          <div class="toggle-button">
            <el-button 
              size="small" 
              type="primary" 
              @click="togglePlaylist"
            >
              {{ showPlaylist ? '隐藏列表' : '显示列表' }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="gift-section">
        <h2>实时送礼记录</h2>
        <div class="gift-list">
          <div v-for="(record, index) in giftRecords" :key="index" class="gift-item">
            <div class="gift-time">{{ record.time }}</div>
            <div class="gift-info">
              <span class="gift-sender">{{ record.sender }}</span>
              赠送给
              <span class="gift-program">{{ record.programName }}</span>
              <span class="gift-type">{{ record.giftType }}</span>
            </div>
          </div>
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
      rankList: [
        { programName: '舞蹈《青花瓷》', rocketCount: 88 },
        { programName: '歌曲《奔跑》', rocketCount: 66 },
        { programName: '相声《快乐生活》', rocketCount: 55 },
        { programName: '魔术《魔法时刻》', rocketCount: 44 },
        { programName: '小品《欢乐时光》', rocketCount: 33 },
      ],
      giftRecords: [
        { time: '20:15:30', sender: '张三', programName: '舞蹈《青花瓷》', giftType: '🚀火箭' },
        { time: '20:14:25', sender: '李四', programName: '歌曲《奔跑》', giftType: '🚀火箭' },
        { time: '20:13:18', sender: '王五', programName: '相声《快乐生活》', giftType: '🚀火箭' },
        { time: '20:12:05', sender: '赵六', programName: '魔术《魔法时刻》', giftType: '🚀火箭' },
        { time: '20:11:55', sender: '孙七', programName: '小品《欢乐时光》', giftType: '🚀火箭' },
      ],
      
      playlist: [],
      currentVideoIndex: -1,
      isLooping: false,
      showPlaylist: true,
      isFullscreen: false,
      
      danmakuEnabled: true,
    }
  },
  computed: {
    currentVideo() {
      return this.currentVideoIndex >= 0 ? URL.createObjectURL(this.playlist[this.currentVideoIndex].file) : ''
    },
    hasNext() {
      return this.currentVideoIndex < this.playlist.length - 1
    },
    hasPrevious() {
      return this.currentVideoIndex > 0
    }
  },
  methods: {
    handleFileSelect(event) {
      const files = Array.from(event.target.files)
      files.forEach(file => {
        this.playlist.push({
          name: file.name,
          file: file
        })
      })
      if (this.currentVideoIndex === -1 && this.playlist.length > 0) {
        this.playVideo(0)
      }
    },
    playVideo(index) {
      this.currentVideoIndex = index
      this.$nextTick(() => {
        if (this.$refs.videoPlayer) {
          this.$refs.videoPlayer.loop = this.isLooping
          this.$refs.videoPlayer.play()
        }
      })
    },
    removeVideo(index) {
      if (index === this.currentVideoIndex) {
        this.$refs.videoPlayer.pause()
        if (this.hasNext) {
          this.playNext()
        } else if (this.hasPrevious) {
          this.playPrevious()
        } else {
          this.currentVideoIndex = -1
        }
      } else if (index < this.currentVideoIndex) {
        this.currentVideoIndex--
      }
      this.playlist.splice(index, 1)
    },
    playNext() {
      if (this.hasNext) {
        this.playVideo(this.currentVideoIndex + 1)
      }
    },
    playPrevious() {
      if (this.hasPrevious) {
        this.playVideo(this.currentVideoIndex - 1)
      }
    },
    toggleLoop() {
      this.isLooping = !this.isLooping
      if (this.$refs.videoPlayer) {
        this.$refs.videoPlayer.loop = this.isLooping
      }
    },
    handleVideoEnd() {
      if (this.isLooping) {
        this.$refs.videoPlayer.play()
      } else if (this.hasNext) {
        this.playNext()
      }
    },
    togglePlaylist() {
      this.showPlaylist = !this.showPlaylist
    },
    toggleFullscreen() {
      const element = this.$refs.bigScreen
      
      if (!this.isFullscreen) {
        if (element.requestFullscreen) {
          element.requestFullscreen()
        } else if (element.webkitRequestFullscreen) {
          element.webkitRequestFullscreen()
        } else if (element.msRequestFullscreen) {
          element.msRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen()
        }
      }
    },
    handleFullscreenChange() {
      this.isFullscreen = !!document.fullscreenElement || 
                         !!document.webkitFullscreenElement || 
                         !!document.mozFullScreenElement || 
                         !!document.msFullscreenElement
    },
    showGiftEffect(gift) {
      const giftElement = document.createElement('div')
      giftElement.className = 'gift-animation'
      
      giftElement.innerHTML = `
        <div class="gift-info">
          <span class="sender">${gift.sender}</span>
          送出了
          <span class="gift">${gift.type}</span>
        </div>
      `
      
      if (gift.type === '🚀火箭') {
        giftElement.classList.add('rocket-animation')
      }
      
      this.$refs.giftEffectArea?.appendChild(giftElement)
      
      setTimeout(() => {
        giftElement.remove()
      }, 3000)
    },
    addDanmaku(message) {
      if (!this.danmakuEnabled) return
      
      const danmaku = document.createElement('div')
      danmaku.className = 'danmaku'
      danmaku.textContent = message
      
      const top = Math.random() * 80 + 10
      danmaku.style.top = `${top}%`
      
      this.$refs.danmakuArea?.appendChild(danmaku)
      
      setTimeout(() => {
        danmaku.remove()
      }, 8000)
    },
    testEffects() {
      this.showGiftEffect({
        sender: '测试用户',
        type: '🚀火箭'
      })
      this.addDanmaku('这是一条测试弹幕消息')
    }
  },
  mounted() {
    document.addEventListener('fullscreenchange', this.handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', this.handleFullscreenChange)
  },
  beforeUnmount() {
    document.removeEventListener('fullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange)
    document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange)
  }
}
</script>

<style scoped>
.big-screen {
  padding: 20px;
  background: #1a1a1a;
  color: #fff;
  min-height: 100vh;
  box-sizing: border-box;
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
  display: flex;
  flex-direction: column;
  position: relative;
}

.video-player {
  width: 100%;
  height: 70%;
  background: #000;
  object-fit: contain;
  transition: height 0.3s ease;
}

.video-player.full-height {
  height: 100%;
}

.toggle-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
}

.video-controls {
  height: 30%;
  background: rgba(0, 0, 0, 0.8);
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: all 0.3s ease;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  margin: 4px 0;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  cursor: pointer;
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.video-name {
  flex: 1;
  margin-right: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-controls-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.rank-list, .gift-list {
  flex: 1;
  overflow-y: auto;
}

h2 {
  margin-bottom: 15px;
  text-align: center;
}

.rank-item {
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  display: flex;
  align-items: center;
}

.rank-num {
  width: 30px;
  font-weight: bold;
  color: #ffd700;
}

.program-name {
  flex: 1;
}

.rocket-count {
  color: #ff4d4f;
}

.gift-item {
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.gift-time {
  color: #888;
  font-size: 0.9em;
  margin-bottom: 5px;
}

.gift-info {
  line-height: 1.5;
}

.gift-sender {
  color: #ffd700;
}

.gift-program {
  color: #1890ff;
}

.gift-type {
  color: #ff4d4f;
  margin-left: 5px;
}

.fullscreen-button {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  padding: 5px;
  border-radius: 4px;
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
}

.fullscreen-btn {
  position: absolute;
  right: 20px;
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .big-screen {
    padding: 10px;
    height: auto;
    min-height: 100vh;
  }

  h1 {
    font-size: 20px;
    margin-bottom: 15px;
  }

  .screen-content {
    flex-direction: column;
    height: auto;
    gap: 15px;
  }

  .rank-section, .gift-section, .video-section {
    width: 100%;
    min-height: 200px;
    max-height: 300px;
  }

  .video-section {
    order: 2;
    height: 200px;
  }

  .rank-section {
    order: 1;
  }

  .gift-section {
    order: 3;
  }

  .rank-item, .gift-item {
    padding: 8px;
    margin: 3px 0;
  }

  .program-name {
    font-size: 14px;
  }

  .gift-time {
    font-size: 12px;
  }

  .gift-info {
    font-size: 14px;
  }

  h2 {
    font-size: 16px;
    margin-bottom: 10px;
  }

  .video-player {
    height: 60%;
  }

  .video-player.full-height {
    height: 100%;
  }

  .video-controls {
    height: 40%;
  }

  .playlist-item {
    padding: 6px;
  }

  .video-name {
    font-size: 12px;
  }

  .toggle-button {
    bottom: 10px;
    right: 10px;
  }

  .fullscreen-button {
    top: 10px;
    right: 10px;
  }

  .fullscreen-btn {
    right: 10px;
  }
}

/* 针对特别小的屏幕 */
@media screen and (max-width: 320px) {
  .big-screen {
    padding: 5px;
  }

  h1 {
    font-size: 18px;
  }

  .rank-section, .gift-section, .video-section {
    min-height: 180px;
  }
}

/* 添加全屏时的样式 */
.big-screen:fullscreen {
  padding: 20px;
  background: #1a1a1a;
}

/* 兼容 webkit 浏览器 */
.big-screen:-webkit-full-screen {
  padding: 20px;
  background: #1a1a1a;
}

/* 兼容 MS 浏览器 */
.big-screen:-ms-fullscreen {
  padding: 20px;
  background: #1a1a1a;
}

/* 添加弹幕相关样式 */
.danmaku-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}

.gift-effect-area {
  position: absolute;
  width: 100%;
  height: 40%;
  top: 30%;
  overflow: hidden;
}

.danmaku-area {
  position: absolute;
  width: 100%;
  height: 80%;
  top: 10%;
  overflow: hidden;
}

.gift-animation {
  position: absolute;
  animation: giftSlide 3s ease-in-out;
  color: #fff;
  font-size: 24px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

.rocket-animation {
  animation: rocketFly 3s ease-in-out;
}

.danmaku {
  position: absolute;
  white-space: nowrap;
  animation: danmakuMove 8s linear;
  color: #fff;
  font-size: 20px;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

@keyframes giftSlide {
  0% { left: -100%; opacity: 0; }
  10% { left: 10%; opacity: 1; }
  90% { left: 10%; opacity: 1; }
  100% { left: -100%; opacity: 0; }
}

@keyframes rocketFly {
  0% { transform: translateX(-100%) scale(0.5); }
  50% { transform: translateX(0) scale(1); }
  100% { transform: translateX(100%) scale(0.5); }
}

@keyframes danmakuMove {
  from { transform: translateX(100%); }
  to { transform: translateX(-100%); }
}
</style> 