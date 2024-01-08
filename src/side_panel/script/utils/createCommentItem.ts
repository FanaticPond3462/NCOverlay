import type { V1Comment } from '@xpadev-net/niconicomments'
import { COLOR_COMMANDS, COLOR_COMMANDS_DARKER } from '@/constants'
import { formatDuration } from '@/utils/formatDuration'
import { formatDate } from '@/utils/formatDate'
import { hexToRGB } from '@/utils/hexToRGB'

const template = document.querySelector<HTMLTemplateElement>(
  '#TemplateItemComment'
)!.content

export const createCommentItem = (comment: V1Comment) => {
  const item = template.firstElementChild!.cloneNode(true) as HTMLElement

  const [
    commentText,
    commentTime,
    commentNicoru,
    commentDate,
    commentCommands,
  ] = [...item.children] as HTMLElement[]

  // コメント
  const commentTextSpan = commentText.firstElementChild! as HTMLElement
  commentTextSpan.textContent = comment.body
  commentText.title = commentTextSpan.textContent

  for (const command of comment.commands) {
    if (['white'].includes(command)) continue

    // カラー
    if (command in COLOR_COMMANDS) {
      commentTextSpan.classList.add('command-color')

      commentTextSpan.style.backgroundColor = COLOR_COMMANDS[command]

      if (COLOR_COMMANDS_DARKER.includes(command)) {
        commentText.style.color = '#fff'
      }
    }
    // カラー (16進数)
    else if (/^#[a-fA-F0-9]{6}$/.test(command)) {
      const rgb = hexToRGB(command)
      const brightness =
        rgb && Math.round((rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000)

      if (brightness !== null) {
        commentTextSpan.classList.add('command-color', 'command-color-hex')

        commentTextSpan.style.backgroundColor = command
        commentText.style.color = brightness > 125 ? 'black' : 'white'
      }
    }
    // その他
    else if (['mincho', 'small', 'big'].includes(command)) {
      commentTextSpan.classList.add(`command-${command}`)
    }
  }

  // 再生時間
  commentTime.textContent = formatDuration(comment.vposMs / 1000)

  // ニコる
  commentNicoru.textContent = comment.nicoruCount.toLocaleString()

  if (10 <= comment.nicoruCount) {
    item.classList.add('nicoru-lv4')
  } else if (6 <= comment.nicoruCount) {
    item.classList.add('nicoru-lv3')
  } else if (3 <= comment.nicoruCount) {
    item.classList.add('nicoru-lv2')
  } else if (1 <= comment.nicoruCount) {
    item.classList.add('nicoru-lv1')
  }

  // 投稿日時
  commentDate.textContent = formatDate(comment.postedAt)

  // コマンド
  commentCommands.textContent = comment.commands.join(' ')
  commentCommands.title = commentCommands.textContent

  return item
}
