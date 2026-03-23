#!/usr/bin/env node

/**
 * 测试代码输出能力 - 简单的趋势数据分析器
 * 这个脚本演示了基本的JavaScript代码生成和数据处理能力
 */

const fs = require('fs');
const path = require('path');

// 模拟趋势数据
const mockTrendData = {
  platforms: [
    {
      id: 'douyin',
      name: '抖音',
      highLikeVideos: [
        { title: '测试视频1', likes: 1000, author: '测试作者' },
        { title: '测试视频2', likes: 2000, author: '测试作者2' }
      ]
    },
    {
      id: 'xiaohongshu',
      name: '小红书',
      highLikeVideos: [
        { title: '测试笔记1', likes: 500, author: '时尚博主' }
      ]
    }
  ]
};

/**
 * 分析趋势数据
 * @param {Object} data - 趋势数据对象
 * @returns {Object} 分析结果
 */
function analyzeTrends(data) {
  const results = {
    totalVideos: 0,
    totalLikes: 0,
    topPlatform: '',
    topVideo: null
  };

  let maxLikes = 0;
  let maxPlatform = '';

  data.platforms.forEach(platform => {
    const platformLikes = platform.highLikeVideos.reduce((sum, video) => sum + video.likes, 0);
    results.totalVideos += platform.highLikeVideos.length;
    results.totalLikes += platformLikes;

    if (platformLikes > maxLikes) {
      maxLikes = platformLikes;
      maxPlatform = platform.name;
    }

    platform.highLikeVideos.forEach(video => {
      if (video.likes > (results.topVideo?.likes || 0)) {
        results.topVideo = video;
      }
    });
  });

  results.topPlatform = maxPlatform;
  return results;
}

/**
 * 生成报告
 * @param {Object} analysis - 分析结果
 */
function generateReport(analysis) {
  console.log('=== 趋势数据分析报告 ===');
  console.log(`总视频数: ${analysis.totalVideos}`);
  console.log(`总点赞数: ${analysis.totalLikes}`);
  console.log(`最热门平台: ${analysis.topPlatform}`);
  if (analysis.topVideo) {
    console.log(`最热门视频: "${analysis.topVideo.title}" by ${analysis.topVideo.author} (${analysis.topVideo.likes} 点赞)`);
  }
  console.log('========================');
}

/**
 * 保存分析结果到文件
 * @param {Object} analysis - 分析结果
 */
function saveResults(analysis) {
  const outputPath = path.join(__dirname, 'analysis-result.json');
  fs.writeFileSync(outputPath, JSON.stringify(analysis, null, 2));
  console.log(`分析结果已保存到: ${outputPath}`);
}

// 主函数
function main() {
  console.log('开始分析趋势数据...\n');

  try {
    const analysis = analyzeTrends(mockTrendData);
    generateReport(analysis);
    saveResults(analysis);

    console.log('\n✅ 代码执行成功！');
    console.log('这个脚本演示了：');
    console.log('- 数据结构定义');
    console.log('- 函数式编程');
    console.log('- 文件I/O操作');
    console.log('- 错误处理');
    console.log('- 模块化代码组织');

  } catch (error) {
    console.error('❌ 执行出错:', error.message);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { analyzeTrends, generateReport, saveResults };