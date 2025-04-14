// components/ui/Pagination.tsx
import Link from "next/link";
import { Button } from "./Button";
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon 
} from '@heroicons/react/24/outline';

interface PaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly baseUrl: string;
  readonly queryParams?: Record<string, string | undefined>;
}

export function Pagination({ currentPage, totalPages, baseUrl, queryParams = {} }: PaginationProps) {
  // Function to generate URL with page parameter
  const getPageUrl = (page: number) => {
    const params = new URLSearchParams();
    
    // Add all query params
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    // Add page parameter
    params.set('page', page.toString());
    
    const queryString = params.toString();
    return `${baseUrl}?${queryString}`;
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxDisplayed = 5;
    
    if (totalPages <= maxDisplayed) {
      // Show all pages if there are few
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Logic for showing pages around current page
      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if at beginning or end
      if (startPage === 2) endPage = Math.min(4, totalPages - 1);
      if (endPage === totalPages - 1) startPage = Math.max(2, totalPages - 3);
      
      // Add ellipsis indicators
      if (startPage > 2) pages.push(-1); // -1 represents an ellipsis
      
      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      
      // Add another ellipsis if needed
      if (endPage < totalPages - 1) pages.push(-2); // -2 for second ellipsis
      
      // Always show last page
      if (totalPages > 1) pages.push(totalPages);
    }
    
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <nav className="flex justify-center mt-6" aria-label="Pagination">
      <ul className="flex items-center space-x-1">
        {/* First page */}
        <li>
          <Link href={getPageUrl(1)} passHref legacyBehavior>
            <Button
              as="a"
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === 1}
              aria-label="Go to first page"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        </li>
        
        {/* Previous page */}
        <li>
          <Link href={getPageUrl(Math.max(1, currentPage - 1))} passHref legacyBehavior>
            <Button
              as="a"
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === 1}
              aria-label="Go to previous page"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
        </li>
        
        {/* Page numbers */}
        {getPageNumbers().map((pageNum, index) => (
          <li key={`page-item-${index}`}>
            {pageNum < 0 ? (
              // Ellipsis
              <span
                className="px-3 py-2 text-gray-500"
              >
                ...
              </span>
            ) : (
              // Page number
              <Link href={getPageUrl(pageNum)} passHref legacyBehavior>
                <Button
                  as="a"
                  variant={pageNum === currentPage ? "primary" : "outline-secondary"}
                  size="sm"
                  aria-current={pageNum === currentPage ? "page" : undefined}
                  aria-label={`Go to page ${pageNum}`}
                >
                  {pageNum}
                </Button>
              </Link>
            )}
          </li>
        ))}
        
        {/* Next page */}
        <li>
          <Link href={getPageUrl(Math.min(totalPages, currentPage + 1))} passHref legacyBehavior>
            <Button
              as="a"
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </li>
        
        {/* Last page */}
        <li>
          <Link href={getPageUrl(totalPages)} passHref legacyBehavior>
            <Button
              as="a"
              variant="outline-secondary"
              size="sm"
              disabled={currentPage === totalPages}
              aria-label="Go to last page"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </li>
      </ul>
    </nav>
  );
}