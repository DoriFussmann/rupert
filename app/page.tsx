export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Zero to Production
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            A comprehensive guide and implementation for taking applications from zero to production.
            Built with Next.js, Prisma, and modern web technologies.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href="/api/health"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Check Health
            </a>
            <a
              href="https://github.com/DoriFussmann/zero-to-production"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              View on GitHub
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Next.js 15
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Latest Next.js with App Router, TypeScript, and Tailwind CSS for modern web development.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                Prisma ORM
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Type-safe database access with Prisma for PostgreSQL integration and migrations.
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                JWT with Jose
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Secure authentication and authorization using JSON Web Tokens with the jose library.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
