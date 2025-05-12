declare module 'pdfjs-dist/legacy/build/pdf.js' {
	import { GlobalWorkerOptions, PDFDocumentProxy, TextContent } from 'pdfjs-dist';
	export function getDocument(
		source: Uint8Array | string | { data: Uint8Array }
	): import('pdfjs-dist').PDFDocumentLoadingTask;
	export { GlobalWorkerOptions, PDFDocumentProxy, TextContent };
}

declare module 'pdfjs-dist/legacy/build/pdf.worker.js' {
	const workerSrc: string;
	export default workerSrc;
}

