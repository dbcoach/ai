import React from 'react';

export function BoltNewBadge() {
  return (
    <div className="fixed bottom-2 right-2 sm:bottom-4 sm:right-4 z-50">
      <a
        href="https://bolt.new/"
        target="_blank"
        rel="noopener noreferrer"
        className="group block transition-all duration-200 transform hover:scale-105 hover:shadow-xl"
        title="Built with Bolt.new"
      >
        <img
          src="/images/bolt_badge.png"
          alt="Built with Bolt.new"
          className="w-8 h-auto sm:w-10 md:w-12 lg:w-14 max-w-none rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        />
      </a>
    </div>
  );
}