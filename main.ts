import puppeteer from 'puppeteer'
import imageToBase64 from 'image-to-base64'

type Item = {
  url: string
  index: number
  title: string
  excerpt: string
  metrics: string
  img: {
    base64: string
    ext: string
  }
}

async function getBillboard() {
  const url = 'https://www.zhihu.com/billboard'

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const arr: Item[] = []
  const page = await browser.newPage()
  await page.goto(url)

  async function getItem(index = 0): Promise<any> {
    const item: Item = {
      index,
      url: '',
      title: '',
      excerpt: '',
      metrics: '',
      img: {
        base64: '',
        ext: '',
      },
    }
    await page.waitForSelector('#root > div > main > div > a')
    const element = await page.$$('#root > div > main > div > a')
    if (element[index]) {
      const titleElement = await element[index].$(
        'div.HotList-itemBody > div.HotList-itemTitle'
      )
      if (titleElement) {
        item.title = await page.evaluate((s) => s.textContent, titleElement)
      }
      const excerptElement = await element[index].$(
        'div.HotList-itemBody > div.HotList-itemExcerpt'
      )
      if (excerptElement) {
        item.excerpt = await page.evaluate((s) => s.textContent, excerptElement)
      }
      const metricsElement = await element[index].$(
        'div.HotList-itemBody > div.HotList-itemMetrics'
      )
      if (metricsElement) {
        item.metrics = await page.evaluate((s) => s.textContent, metricsElement)
      }
      const imgElement = await element[index].$(
        'div.HotList-itemImgContainer > img'
      )
      if (imgElement) {
        const imgUrl = await page.evaluate((s) => s.src, imgElement)
        if (imgUrl) {
          item.img.base64 = await imageToBase64(imgUrl)
          const url = new URL(imgUrl)
          item.img.ext = url.pathname.split('.').pop() ?? 'jpg'
        }
      }
      await Promise.all([element[index].click(), page.waitForNavigation()])
      item.url = page.url()
      console.log('index:', index, item.title)
      arr.push(item)
      await page.goBack({
        waitUntil: 'networkidle0',
      })
      return getItem(index + 1)
    }
  }

  await getItem()
  await browser.close()
  return arr
}

;(async function main() {
  const arr = await getBillboard()
  console.log('arr:', arr)
})()
