import TurndownService from 'turndown'

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced',
  bulletListMarker: '-',
  emDelimiter: '*',
})

const convertHtmlToMarkdown = (html: string): string => {
  return turndownService.turndown(html).trim()
}

export const generateMarkdown = (html: string): string => {
  return convertHtmlToMarkdown(html)
}