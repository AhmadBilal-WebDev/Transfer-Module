'use client';

import { Pagination } from '@mantine/core';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BlogPagination({
  totalPages,
  currentPage,
  total,
  from,
  to,
  metaClassName,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/blogs?${params.toString()}`);
  };

  if (totalPages <= 1) return null;

  return (
    <>
      <Pagination
        total={totalPages}
        value={currentPage}
        onChange={handlePageChange}
        size="md"
        radius="xl"
        withEdges
        color="#004b95"
      />
      {total > 0 && (
        <div className={metaClassName}>
          Showing {from} to {to} of {total} blogs
        </div>
      )}
    </>
  );
}
