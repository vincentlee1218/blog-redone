// PM2 process file: pm2 start ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: 'blog-server',
      script: 'src/index.js',
      
      env: { NODE_ENV: 'production' },
    },
  ],
}
