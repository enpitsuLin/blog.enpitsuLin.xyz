import { Link } from '~/components/Link';

export { Page };

const Exception = (props: { code: number; title: string }) => {
  return (
    <div className="flex flex-col items-start justify-start md:mt-24 md:flex-row md:items-center md:justify-center md:space-x-6">
      <div className="space-x-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-6xl font-extrabold leading-9 tracking-tight text-gray-900 dark:text-gray-100 md:border-r-2 md:px-6 md:text-8xl md:leading-14">
          {props.code}
        </h1>
      </div>
      <div className="max-w-md">
        <p className="mb-4 text-xl font-bold leading-normal md:text-2xl">{props.title}</p>
        <p className="mb-8">不过不用着急，你可以返回首页找到很多其他更精彩的东西。</p>
        <Link href="/">
          <button className="focus:shadow-outline-blue inline rounded-lg border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium leading-5 text-white shadow transition-colors duration-150 hover:bg-blue-700 focus:outline-none dark:hover:bg-blue-500">
            返回首页
          </button>
        </Link>
      </div>
    </div>
  );
};

function Page({ is404 }: { is404: boolean }) {
  if (is404) {
    return <Exception code={404} title="糟糕!这个页面好像消失了." />;
  } else {
    return <Exception code={500} title="我去! 怎么又有个bug." />;
  }
}
