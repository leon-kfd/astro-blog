import rss from '@astrojs/rss';

const items = import.meta.globEager('../content/*.md')
const posts = Object.values(items);

export const get = () => rss({
  title: 'Leon.D’s Blog',
  description: 'Leon.D前端技术分享, 记录Howdz起始页、Howdyjs组件库等开源项目开发经验, 主要技术栈有Vue, Vite, Typescript, Nodejs, PHP, Mysql, Nginx等',
  site: import.meta.env.SITE,
  items: posts.map(post => {
    const matchURL = post.file.match(/[^/]+(?=\.md)/g)[0]
    return {
      link: `${import.meta.env.SITE}/blog/${matchURL}`,
      title: post.frontmatter.title,
      pubDate: post.frontmatter.date,
      description: post.frontmatter.desc
    }
  }),
  customData: `<language>zh-CN</language>`,
});
