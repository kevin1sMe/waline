import { fetchVisitCount, postVisitCount } from './fetch';
import { decodePath } from './path';

import type { PostVisitCountOptions } from './fetch';

const renderVisitorCount = (
  counts: number[],
  countElements: HTMLElement[]
): void => {
  countElements.forEach((element, index) => {
    // TODO: Remove the first one
    (
      element.querySelector<HTMLElement>('.leancloud-visitors-count') || element
    ).innerText = counts[index].toString();
  });
};

export interface UpdateVisitOptions extends PostVisitCountOptions {
  signal: AbortSignal;
}

export const updateVisitor = ({
  serverURL,
  path,
  signal,
}: UpdateVisitOptions): void => {
  const countIncrease = postVisitCount({ serverURL, path });
  const countElements = Array.from(
    // visitor selectors
    document.querySelectorAll<HTMLElement>(
      // TODO: Remove the last two
      '.waline-visitor-count,.leancloud_visitors,.leancloud-visitors'
    )
  ).filter((el) => el.getAttribute('id'));

  const ids = countElements.map((el: Element) =>
    decodePath(el.getAttribute('id') || '')
  );

  const restIds = ids.filter((id) => id !== path);

  // if we should fetch count of other pages
  if (restIds.length) {
    void (
      restIds.length === ids.length
        ? // all the ids are other pages, so no need to wait
          Promise.resolve()
        : // wait till the post success
          countIncrease
    )
      .then(() => fetchVisitCount({ serverURL, paths: ids, signal }))
      .then((counts) => renderVisitorCount(counts, countElements))
      .catch((err: Error) => {
        if (err.name !== 'AbortError') console.error(err.message);
      });
  } else {
    // all the id are current page, so no need to fetch
    void countIncrease.then((count) =>
      renderVisitorCount(
        new Array<number>(countElements.length).fill(count),
        countElements
      )
    );
  }
};
