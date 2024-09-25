export function OutdateTip(props: { date: Date }) {
  const TIME_PRE_DAY = 1000 * 60 * 60 * 24
  const daysAgo = () => Math.ceil((+new Date() - +props.date) / TIME_PRE_DAY)
  if (daysAgo() > 80) {
    return (
      <time
        dateTime={props.date.toISOString()}
        class="block bg-#fffbeb px-5 py-2 text-sm text-#947600"
      >
        本文最后更新于
        {' '}
        {daysAgo()}
        {' '}
        天前，文中所描述的信息可能已发生改变
      </time>
    )
  }
  return null
}
