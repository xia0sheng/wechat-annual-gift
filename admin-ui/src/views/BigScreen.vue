<template>
  <div class="big-screen" ref="screenRef">
    <div class="screen-content">
      <!-- 左侧视频区域 -->
      <div class="video-section" :class="{ 'full-width': !showPlaylist }">
        <div class="video-container">
          <!-- 视频播放器 -->
          <video
            ref="videoRef"
            class="video-player"
            :src="currentVideo"
            @ended="handleVideoEnd"
            @timeupdate="handleTimeUpdate"
            @click="togglePlay"
            @pause="isPaused = true"
            @play="isPaused = false"
            controlsList="nodownload nofullscreen noremoteplayback"
            nocontrols
            disablePictureInPicture
            :disableRemotePlayback="true"
          >
            您的浏览器不支持 video 标签
          </video>

          <!-- 控制栏 -->
          <div 
            class="video-controls-wrapper"
            :class="{ 'controls-hidden': isFullscreen && !showControls }"
            @mousemove="handleControlsMouseMove"
            @mouseleave="handleControlsMouseLeave"
          >
            <!-- 进度条容器 -->
            <div class="progress-container">
              <div class="progress-bar">
                <el-slider
                  v-model="progress"
                  :min="0"
                  :max="100"
                  :format-tooltip="value => formatTime(duration * value / 100)"
                  @input="handleProgressDrag"
                />
              </div>
            </div>

            <div class="controls-panel">
              <div class="left-controls">
                <!-- 播放/暂停 -->
                <el-button class="control-btn" circle @click="togglePlay">
                  <i :class="isPaused ? 'el-icon-video-play' : 'el-icon-video-pause'"></i>
                </el-button>

                <!-- 上一个/下一个 -->
                <el-button 
                  class="control-btn" 
                  circle 
                  @click="playPrevious"
                  :disabled="!hasPrevious"
                >
                  <i class="el-icon-arrow-left"></i>
                </el-button>
                <el-button 
                  class="control-btn" 
                  circle 
                  @click="playNext"
                  :disabled="!hasNext"
                >
                  <i class="el-icon-arrow-right"></i>
                </el-button>

                <!-- 循环播放 -->
                <el-button 
                  class="control-btn" 
                  circle 
                  @click="toggleLoop"
                  :type="isLooping ? 'primary' : ''"
                >
                  <i class="el-icon-refresh"></i>
                </el-button>

                <!-- 音量控制 -->
                <div class="volume-control">
                  <el-button class="control-btn" circle @click="toggleMute">
                    <i :class="volumeIcon"></i>
                  </el-button>
                  <el-slider 
                    v-model="volume" 
                    :min="0" 
                    :max="100"
                    @input="handleVolumeChange"
                    class="volume-slider"
                  />
                </div>

                <!-- 时间显示 -->
                <span class="time-display">
                  {{ formatTime(currentTime) }} / {{ formatTime(duration) }}
                </span>
              </div>

              <div class="right-controls">
                <!-- 播放列表按钮 -->
                <div class="control-item">
                  <el-button 
                    class="control-btn text-btn"
                    :class="{ 'is-active': showPlaylist }"
                    @click="togglePlaylist"
                  >
                    播放列表
                  </el-button>
                </div>

                <!-- 循环模式按钮 -->
                <div class="control-item">
                  <el-button 
                    class="control-btn text-btn"
                    :class="{ 'is-active': loopMode !== 'none' }"
                    @click="toggleLoopMode"
                  >
                    {{ loopModeText }}
                  </el-button>
                </div>

                <!-- 全屏按钮 -->
                <div class="control-item">
                  <el-button 
                    class="control-btn text-btn"
                    @click="toggleFullscreen"
                  >
                    {{ isFullscreen ? '退出全屏' : '全屏' }}
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 礼物动画容器 -->
          <div class="gift-container" :class="{ 'fullscreen': isFullscreen }">
            <transition name="gift">
              <div v-if="showGift" class="gift-box">
                <div class="gift-info">
                  <div class="gift-avatar">
                    <img :src="giftData.senderAvatar || '/default-avatar.png'" alt="avatar" />
                  </div>
                  <div class="gift-content">
                    <span class="sender">{{ giftData.realName }}</span>
                    <div class="gift-text">
                      为 <span class="program-name">{{ giftData.programName }}</span> 送出了 
                      <span class="gift-icon">🚀</span>
                      <span class="gift-count">×{{ giftData.giftCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </div>

      <!-- 右侧播放列表 -->
      <div class="playlist-section" v-show="showPlaylist">
        <div class="playlist-header">
          <h3>播放列表</h3>
          <el-button 
            type="primary"
            size="small"
            @click="$refs.fileInput.click()"
          >
            添加视频
          </el-button>
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            multiple
            style="display: none"
            @change="handleFileSelect"
          >
        </div>
        
        <div class="playlist-content">
          <div 
            v-for="(item, index) in playlist" 
            :key="index"
            class="playlist-item"
            :class="{ active: index === currentVideoIndex }"
            @click="playVideo(index)"
          >
            <span class="item-index">{{ index + 1 }}</span>
            <span class="item-name">{{ item.name }}</span>
            <el-button 
              class="delete-btn"
              size="small" 
              type="danger"
              circle
              @click.stop="removeVideo(index)"
            >
              <i class="el-icon-delete"></i>
            </el-button>
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
      showGift: false,
      giftData: {
        senderAvatar: '',
        realName: '',
        giftCount: 0
      },
      ws: null,
      wsReconnectTimer: null,
      wsReconnectAttempts: 0,
      wsMaxReconnectAttempts: 5,
      processedMessageIds: new Set(),
      isAnimating: false,
      animationQueue: [],
      _isMount: false,
      _hideGiftTimer: null,
      _animationInProgress: false,
      _animationQueue: [],
      _animationTimer: null,
      _transitionTimer: null,
      isPaused: true,
      isMuted: false,
      volume: 100,
      currentTime: 0,
      duration: 0,
      progress: 0,
      showControls: true,
      controlsTimer: null,
      loopMode: 'none', // 'none', 'single', 'all'
      mouseMoving: false,
      mouseMovingTimer: null,
      lastMouseMoveTime: Date.now(),
    }
  },
  computed: {
    currentVideo() {
      if (this.currentVideoIndex >= 0 && this.playlist[this.currentVideoIndex]) {
        const file = this.playlist[this.currentVideoIndex].file;
        console.log('[Video URL]', {
          index: this.currentVideoIndex,
          fileName: file.name,
          url: URL.createObjectURL(file)
        });
        return URL.createObjectURL(file);
      }
      return '';
    },
    hasNext() {
      return this.currentVideoIndex < this.playlist.length - 1
    },
    hasPrevious() {
      return this.currentVideoIndex > 0
    },
    volumeIcon() {
      if (this.isMuted || this.volume === 0) {
        return 'el-icon-turn-off-microphone';
      } else if (this.volume < 50) {
        return 'el-icon-microphone';
      } else {
        return 'el-icon-mic';
      }
    },
    loopModeIcon() {
      switch(this.loopMode) {
        case 'single':
          return 'el-icon-refresh-right';
        case 'all':
          return 'el-icon-refresh';
        default:
          return 'el-icon-refresh-left';
      }
    },
    loopModeText() {
      switch(this.loopMode) {
        case 'single':
          return '单个循环';
        case 'all':
          return '列表循环';
        default:
          return '不循环';
      }
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
        if (this.$refs.videoRef) {
          this.$refs.videoRef.loop = this.isLooping
          this.$refs.videoRef.play()
        }
      })
    },
    removeVideo(index) {
      if (index === this.currentVideoIndex) {
        this.$refs.videoRef.pause()
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
      if (this.$refs.videoRef) {
        this.$refs.videoRef.loop = this.isLooping
      }
    },
    handleVideoEnd() {
      if (this.loopMode === 'single') {
        this.$refs.videoRef.play();
      } else if (this.loopMode === 'all') {
        if (this.hasNext) {
          this.playNext();
        } else {
          // 播放列表第一个视频
          this.playVideo(0);
        }
      }
    },
    togglePlaylist() {
      if (this.isFullscreen) {
        this.exitFullscreen();
        // 等待退出全屏完成后再显示播放列表
        setTimeout(() => {
          this.showPlaylist = true;
        }, 100);
      } else {
        this.showPlaylist = !this.showPlaylist;
      }
    },
    exitFullscreen() {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    },
    toggleFullscreen() {
      const element = this.$refs.screenRef;
      console.log('[Fullscreen] 尝试切换全屏:', {
        element: element?.tagName,
        apis: {
          standard: !!element?.requestFullscreen,
          webkit: !!element?.webkitRequestFullscreen,
          moz: !!element?.mozRequestFullScreen,
          ms: !!element?.msRequestFullscreen
        },
        browser: navigator.userAgent
      });

      if (!this.isFullscreen) {
        try {
          if (element.requestFullscreen) {
            element.requestFullscreen().then(() => {
              console.log('[Fullscreen] 进入全屏成功');
            }).catch(err => {
              console.error('[Fullscreen] 进入全屏失败:', err.message);
            });
          } else if (element.webkitRequestFullscreen) {
            element.webkitRequestFullscreen();
            console.log('[Fullscreen] 使用 Webkit 全屏');
          } else if (element.mozRequestFullScreen) {
            element.mozRequestFullScreen();
            console.log('[Fullscreen] 使用 Mozilla 全屏');
          } else if (element.msRequestFullscreen) {
            element.msRequestFullscreen();
            console.log('[Fullscreen] 使用 IE 全屏');
          }
        } catch (err) {
          console.error('[Fullscreen] 错误:', err.message);
        }
      } else {
        this.exitFullscreen();
        console.log('[Fullscreen] 退出全屏');
      }
    },
    handleFullscreenChange() {
      const wasFullscreen = this.isFullscreen;
      this.isFullscreen = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      
      console.log('[Fullscreen] 状态变化:', {
        从: wasFullscreen,
        到: this.isFullscreen
      });
    },
    addEventListeners() {
      document.addEventListener('fullscreenchange', this.handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    removeEventListeners() {
      document.removeEventListener('fullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', this.handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', this.handleFullscreenChange);
    },
    _showGiftEffect(gift) {
      console.log('[BigScreen] _showGiftEffect called with:', gift);
      
      // 将礼物添加到队列
      this._animationQueue.push(gift);
      console.log('[BigScreen] Animation queue length:', this._animationQueue.length);
      
      // 如果没有动画在播放，开始播放
      if (!this._animationInProgress) {
        this._playNextAnimation();
      }
    },
    
    _playNextAnimation() {
      if (this._animationQueue.length === 0 || this._animationInProgress) {
        console.log('[BigScreen] No animations to play or animation in progress');
        return;
      }
      
      const gift = this._animationQueue.shift();
      console.log('[BigScreen] Playing animation for gift:', gift);
      
      this._animationInProgress = true;
      
      // 先重置状态
      this.showGift = false;
      this.giftData = gift;
      
      // 使用 nextTick 确保 DOM 更新
      this.$nextTick(() => {
        // 短暂延迟后显示动画
        this._transitionTimer = setTimeout(() => {
          this.showGift = true;
          
          // 设置动画结束定时器
          this._animationTimer = setTimeout(() => {
            console.log('[BigScreen] Animation completed');
            this.showGift = false;
            
            // 等待淡出动画完成
            setTimeout(() => {
              this._animationInProgress = false;
              
              // 检查是否有下一个动画
              if (this._animationQueue.length > 0) {
                console.log('[BigScreen] Playing next animation from queue');
                this._playNextAnimation();
              }
            }, 300); // 等待淡出动画完成
            
          }, 2500); // 动画显示时间
        }, 100); // 短暂延迟以确保状态重置
      });
    },
    testEffects() {
      this._showGiftEffect({
        senderAvatar: '/default-avatar.png',
        realName: '测试用户',
        giftCount: 1
      });
    },
    initWebSocket() {
      console.log('[BigScreen] Initializing WebSocket');
      
      // 确保只有一个 WebSocket 连接
      this.closeWebSocket();
      
      const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${location.host}/ws/gift`;
      
      console.log('[BigScreen] Creating new WebSocket connection:', wsUrl);
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        console.log('[BigScreen] WebSocket connected successfully');
        this.wsReconnectAttempts = 0; // 重置重连次数
      };
      
      this.ws.onclose = () => {
        console.log('[BigScreen] WebSocket connection closed');
        if (this._isMount && this.wsReconnectAttempts < this.wsMaxReconnectAttempts) {
          console.log('[BigScreen] Attempting to reconnect...');
          this.wsReconnectAttempts++;
          this.wsReconnectTimer = setTimeout(() => {
            console.log('[BigScreen] Reconnecting... Attempt:', this.wsReconnectAttempts);
            this.initWebSocket();
          }, 3000);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('[BigScreen] WebSocket error:', error);
      };
      
      this.ws.onmessage = this.handleWebSocketMessage.bind(this);
    },
    closeWebSocket() {
      if (this.ws) {
        console.log('[BigScreen] Closing existing WebSocket connection');
        this.ws.onclose = null; // 移除重连逻辑
        this.ws.close();
        this.ws = null;
      }
      
      if (this.wsReconnectTimer) {
        clearTimeout(this.wsReconnectTimer);
        this.wsReconnectTimer = null;
      }
    },
    handleWebSocketMessage(event) {
      try {
        const data = JSON.parse(event.data);
        console.log('[BigScreen] WebSocket message received:', data);
        
        if (data.type === 'gift' && data.giftType === 'rocket') {
          const messageId = `${data.timestamp}-${data.sender}-${data.giftCount}`;
          console.log('[BigScreen] Processing gift message:', messageId);
          
          if (!this.processedMessageIds.has(messageId)) {
            console.log('[BigScreen] New message, showing animation');
            this.processedMessageIds.add(messageId);
            
            this._showGiftEffect({
              senderAvatar: data.senderAvatar,
              realName: data.realName,
              giftCount: data.giftCount
            });
            
            setTimeout(() => {
              console.log('[BigScreen] Removing message from processed cache:', messageId);
              this.processedMessageIds.delete(messageId);
            }, 5000);
          } else {
            console.log('[BigScreen] Duplicate message ignored:', messageId);
          }
        }
      } catch (error) {
        console.error('[BigScreen] Error processing message:', error);
      }
    },
    updateRankList(giftData) {
      const index = this.rankList.findIndex(item => 
        item.programName === giftData.programName
      )
      
      if (index !== -1) {
        this.rankList[index].rocketCount++
        this.rankList.sort((a, b) => b.rocketCount - a.rocketCount)
      } else {
        this.rankList.push({
          programName: giftData.programName,
          rocketCount: 1
        })
      }
    },
    updateGiftRecords(giftData) {
      const now = new Date()
      const time = `${now.getHours().toString().padStart(2, '0')}:${
        now.getMinutes().toString().padStart(2, '0')}:${
        now.getSeconds().toString().padStart(2, '0')}`
      
      this.giftRecords.unshift({
        time,
        sender: giftData.sender,
        programName: giftData.programName,
        giftType: '🚀火箭'
      })
      
      if (this.giftRecords.length > 20) {
        this.giftRecords.pop()
      }
    },
    handleVisibilityChange() {
      if (document.hidden) {
        console.log('[BigScreen] Page hidden, closing WebSocket');
        this.closeWebSocket();
      } else {
        console.log('[BigScreen] Page visible, reconnecting WebSocket');
        this.initWebSocket();
      }
    },
    togglePlay() {
      const video = this.$refs.videoRef;
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    },
    handleTimeUpdate() {
      const video = this.$refs.videoRef;
      this.currentTime = video.currentTime;
      this.duration = video.duration;
      this.progress = (video.currentTime / video.duration) * 100;
    },
    handleProgressDrag(value) {
      const video = this.$refs.videoRef;
      if (video) {
        video.currentTime = (value / 100) * video.duration;
      }
    },
    toggleMute() {
      const video = this.$refs.videoRef;
      video.muted = !video.muted;
      this.isMuted = video.muted;
    },
    handleVolumeChange(value) {
      const video = this.$refs.videoRef;
      video.volume = value / 100;
      if (value === 0) {
        this.isMuted = true;
      } else {
        this.isMuted = false;
      }
    },
    formatTime(seconds) {
      if (!seconds) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    handleControlsMouseMove() {
      if (!this.isFullscreen) return;
      
      console.log('[Controls] 显示控制栏');
      this.showControls = true;
      
      if (this.controlsTimer) {
        clearTimeout(this.controlsTimer);
      }
      
      this.controlsTimer = setTimeout(() => {
        if (this.isFullscreen) {
          console.log('[Controls] 准备隐藏控制栏');
          this.showControls = false;
        }
      }, 3000);
    },
    handleControlsMouseLeave() {
      if (!this.isFullscreen) return;
      
      console.log('[Controls] 鼠标离开，准备隐藏控制栏');
      if (this.controlsTimer) {
        clearTimeout(this.controlsTimer);
      }
      
      this.controlsTimer = setTimeout(() => {
        if (this.isFullscreen) {
          console.log('[Controls] 鼠标离开，隐藏控制栏');
          this.showControls = false;
        }
      }, 1000);
    },
    handleDrawerClose() {
      this.showPlaylist = false;
    },
    toggleLoopMode() {
      switch(this.loopMode) {
        case 'none':
          this.loopMode = 'single';
          break;
        case 'single':
          this.loopMode = 'all';
          break;
        case 'all':
          this.loopMode = 'none';
          break;
      }
      // 更新视频循环状态
      if (this.$refs.videoRef) {
        this.$refs.videoRef.loop = this.loopMode === 'single';
      }
    },
  },
  watch: {
    // 简化全屏状态监听
    isFullscreen(newVal) {
      if (!newVal) {
        // 退出全屏时重置状态
        this.showControls = true;
        if (this.controlsTimer) {
          clearTimeout(this.controlsTimer);
          this.controlsTimer = null;
        }
      }
    }
  },
  mounted() {
    this._isMount = true;
    console.log('[BigScreen] 组件挂载');
    
    // 添加调试信息
    window._debugBigScreen = this;
    
    // 移除之前可能存在的事件监听器
    this.removeEventListeners();
    
    // 添加新的事件监听器
    this.addEventListeners();
    
    // 初始化 WebSocket
    this.initWebSocket();
    
    // 添加页面可见性监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },
  beforeUnmount() {
    this._isMount = false;
    this.removeEventListeners();
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.closeWebSocket();
    
    // 清理所有定时器和队列
    if (this._animationTimer) {
      clearTimeout(this._animationTimer);
      this._animationTimer = null;
    }
    if (this._transitionTimer) {
      clearTimeout(this._transitionTimer);
      this._transitionTimer = null;
    }
    this._animationQueue = [];
    this._animationInProgress = false;
    if (this.controlsTimer) {
      clearTimeout(this.controlsTimer);
    }
    if (this.mouseMovingTimer) {
      clearTimeout(this.mouseMovingTimer);
    }
    console.log('[BigScreen] 事件监听器已移除');
  }
}
</script>

<style>
/* 在 index.html 中引入自定义图标字体 */
@import url('//at.alicdn.com/t/font_3456789_xyz123.css');
</style>

<style scoped>
.big-screen {
  position: relative;
  width: 100%;
  height: 100vh;
  background: #1a1a1a;
}

.screen-content {
  display: flex;
  gap: 1px;
  height: calc(100vh - 60px); /* 减去顶部标题的高度 */
  background: #1a1a1a;
}

.video-section {
  flex: 1;
  min-width: 0;
  position: relative;
  transition: all 0.3s ease;
}

.video-section.full-width {
  flex: 1;
}

.playlist-section {
  width: 300px;
  background: #1a1a1a;  /* 改为纯黑色背景 */
  display: flex;
  flex-direction: column;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;  /* 确保文字为白色 */
}

.playlist-header {
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);  /* 添加略深的背景 */
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.playlist-header h3 {
  margin: 0;
  color: #fff;
  font-size: 16px;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.playlist-item {
  display: flex;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 5px;
  background: rgba(255, 255, 255, 0.05);  /* 添加轻微的背景色 */
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.item-index {
  width: 30px;
  color: #999;
  text-align: center;
}

.item-name {
  flex: 1;
  margin: 0 10px;
  color: #fff;  /* 确保文字为白色 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
}

.playlist-item:hover .delete-btn {
  opacity: 1;
}

/* 滚动条样式优化 */
.playlist-content::-webkit-scrollbar {
  width: 6px;
}

.playlist-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.playlist-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.playlist-content::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 控制按钮样式优化 */
.text-btn {
  --button-size: auto;
  min-width: 80px;
  height: 32px;
  background: rgba(0, 0, 0, 0.7) !important;  /* 加深背景色 */
  border-radius: 4px !important;
  padding: 0 12px !important;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff !important;  /* 确保文字为白色 */
  border: 1px solid rgba(255, 255, 255, 0.1) !important;  /* 添加边框 */
}

.text-btn:hover {
  background: rgba(64, 158, 255, 0.3) !important;
  border-color: rgba(64, 158, 255, 0.5) !important;
}

.text-btn.is-active {
  background: rgba(64, 158, 255, 0.5) !important;
  border-color: rgba(64, 158, 255, 0.8) !important;
}

/* 全屏模式下隐藏播放列表 */
:fullscreen .playlist-section {
  display: none;
}

/* 修复全屏菜单栏自动隐藏 */
.controls-hidden {
  opacity: 0;
  transform: translateY(100%);
  pointer-events: none;
}

.video-controls-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  transition: opacity 0.3s ease;
  opacity: 1;
  padding-bottom: 20px; /* 增加底部内边距 */
}

.controls-hidden {
  opacity: 0;
  pointer-events: none;
}

/* 确保全屏时控制栏正确显示 */
:fullscreen .video-controls-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

.video-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.video-player {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* 隐藏原生全屏按钮 */
.video-player::-webkit-media-controls-fullscreen-button {
  display: none !important;
}

/* 视频控制面板样式 */
.video-controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.playlist-controls {
  display: flex;
  gap: 10px;
}

.fullscreen-control {
  margin-left: auto;
}

.gift-container {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: v-bind('showPlaylist ? "30%" : "0"');
  pointer-events: none;
  overflow: hidden;
}

.gift-box {
  position: fixed;
  left: 50%;
  bottom: 20%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50px;
  padding: 10px 20px;
  display: flex;
  align-items: center;
  white-space: nowrap;
}

.gift-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.gift-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #ffd700;
}

.gift-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gift-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sender {
  color: #ffd700;
  font-weight: bold;
  font-size: 16px;
}

.program-name {
  color: #ffd700;
  font-weight: bold;
}

.gift-text {
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  white-space: nowrap;
}

.gift-icon {
  font-size: 24px;
}

.gift-count {
  color: #ffd700;
  font-weight: bold;
  font-size: 18px;
}

/* 礼物动画 */
.gift-enter-active {
  animation: giftIn 0.5s ease-out;
}

.gift-leave-active {
  animation: giftOut 0.3s ease-in;
}

@keyframes giftIn {
  0% {
    transform: translateX(-50%) translateY(100px) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
}

@keyframes giftOut {
  0% {
    transform: translateX(-50%) translateY(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(-50%) translateY(-100px) scale(0.8);
    opacity: 0;
  }
}

/* 确保控制面板在全屏时也能显示 */
:fullscreen .video-controls {
  position: fixed;
}

:-webkit-full-screen .video-controls {
  position: fixed;
}

:-moz-full-screen .video-controls {
  position: fixed;
}

:-ms-fullscreen .video-controls {
  position: fixed;
}

/* 播放列表面板样式 */
.playlist-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  z-index: 3;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.playlist-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.playlist-header h3 {
  margin: 0;
}

.playlist-content {
  flex: 1;
  overflow-y: auto;
}

.playlist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
}

.playlist-item:hover {
  background: rgba(255, 255, 255, 0.1);
}

.playlist-item.active {
  background: rgba(64, 158, 255, 0.2);
}

.item-name {
  flex: 1;
  margin-right: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 确保播放列表在全屏时也能正确显示 */
:fullscreen .playlist-panel {
  position: fixed;
}

:-webkit-full-screen .playlist-panel {
  position: fixed;
}

:-moz-full-screen .playlist-panel {
  position: fixed;
}

:-ms-fullscreen .playlist-panel {
  position: fixed;
}

.custom-controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  padding: 20px;
  transition: opacity 0.3s;
  z-index: 2;
}

.controls-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.left-controls, .right-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.volume-slider {
  width: 100px;
}

.progress-bar {
  position: relative;
  height: 4px;
  margin-bottom: 10px;
  cursor: pointer;
}

.progress-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
}

.progress-current {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #409EFF;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: left 0.1s linear;
}

.time-display {
  color: #fff;
  font-size: 14px;
  margin-left: 10px;
}

/* 全屏时的控制栏样式 */
:fullscreen .custom-controls {
  position: fixed;
}

:-webkit-full-screen .custom-controls {
  position: fixed;
}

:-moz-full-screen .custom-controls {
  position: fixed;
}

:-ms-fullscreen .custom-controls {
  position: fixed;
}

.video-controls-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  transition: opacity 0.3s ease;
  opacity: 1;
}

.controls-hidden {
  opacity: 0;
  pointer-events: none;
}

.progress-container {
  position: relative; /* 改为相对定位 */
  padding: 20px 20px 10px 20px; /* 调整内边距 */
  margin-bottom: 10px; /* 增加与控制按钮的间距 */
}

.control-item {
  position: relative;
  margin: 0 5px;
}

.control-btn {
  --button-size: 36px;
  width: var(--button-size);
  height: var(--button-size);
  background: transparent !important;
  border: none !important;
  padding: 0;
  color: #fff !important;
  transition: all 0.2s ease;
}

.control-btn:hover {
  transform: scale(1.1);
  color: #409EFF !important;
}

.control-btn.is-active {
  color: #409EFF !important;
}

.control-btn i {
  font-size: 20px;
}

/* 自定义图标 */
.iconfont {
  font-family: "iconfont" !important;
}

.icon-playlist:before {
  content: "\e636";  /* 使用实际的 Unicode 编码 */
}

.icon-loop-none:before {
  content: "\e637";
}

.icon-loop-single:before {
  content: "\e638";
}

.icon-loop-all:before {
  content: "\e639";
}

.icon-fullscreen:before {
  content: "\e63a";
}

.icon-exitfullscreen:before {
  content: "\e63b";
}

/* 确保全屏模式下控制栏正确显示 */
:fullscreen .video-controls-wrapper {
  position: fixed;
  padding-bottom: 40px;
}

/* 播放列表抽屉样式优化 */
.playlist-drawer {
  background: rgba(0, 0, 0, 0.9) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}

/* 文字按钮样式 */
.text-btn {
  --button-size: auto;
  min-width: 80px;
  height: 32px;
  background: rgba(0, 0, 0, 0.5) !important;
  border-radius: 4px !important;
  padding: 0 12px !important;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-btn:hover {
  background: rgba(64, 158, 255, 0.3) !important;
  transform: none;
}

.text-btn.is-active {
  background: rgba(64, 158, 255, 0.5) !important;
}

/* 控制栏样式优化 */
.video-controls-wrapper {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.7));
  transition: opacity 0.3s ease;
  opacity: 1;
}

.controls-panel {
  padding: 0 20px 10px 20px; /* 调整控制面板内边距 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-right: 10px;
}

/* 移除不需要的图标相关样式 */
.iconfont,
.icon-playlist:before,
.icon-loop-none:before,
.icon-loop-single:before,
.icon-loop-all:before,
.icon-fullscreen:before,
.icon-exitfullscreen:before {
  display: none;
}

/* 进度条样式优化 */
.progress-bar {
  width: 100%;
  padding: 5px 0;
}

/* 调整 el-slider 的样式 */
:deep(.el-slider) {
  margin: 0;
}

:deep(.el-slider__runway) {
  margin: 0;
  height: 4px;
}

:deep(.el-slider__bar) {
  height: 4px;
}

:deep(.el-slider__button-wrapper) {
  top: -14px;
}

:deep(.el-slider__button) {
  width: 12px;
  height: 12px;
}
</style> 