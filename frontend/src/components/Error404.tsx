"use client"

import Link from "next/link";
import Image from "next/image";
import {
  AiFillHome,
  AiOutlineCompass,
  AiOutlineHeart,
  AiOutlineUser,
} from "react-icons/ai";

import { useRouter } from "next/navigation";


const Error404 = () => {
  const router = useRouter();
  return (
    <>
      {/*desktop */}
      <section className="hidden md:block min-h-screen bg-white relative overflow-hidden">

        <header className="flex items-center justify-between px-20 py-10">
          <div className="flex items-center gap-3">
            <Image
              src="/TCNewLogo.jpg"
              alt="Tooclarity"
              width={32}
              height={32}
            />
            <span className="text-2xl font-bold text-blue-700 ">
              TooClarity
            </span>
          </div>

          <div className="text-sm text-blue-600 font-medium">
            Need help? Call{" "}
            <a href="tel:+919391160205" className="underline">
              +91 9391160205
            </a>
          </div>
        </header>

        <div className="px-30 mt-10 grid grid-cols-2 items-center">
        
          <div>
            <h1 className="text-7xl font-bold text-gray-900 font-sans">
              Error 404
            </h1>

            <p className="mt-6 text-xl text-gray-600 max-w-md leading-relaxed font-sans">
              Something went wrong, the page you’re looking for is not found.
            </p>
            
            <button onClick={() => router.back()}
              className="inline-block mt-8 bg-blue-700 text-white px-8 py-2 rounded-xl font-medium hover:bg-blue-800 transition">
                Back to Previous Page
            </button>
          </div>
        </div>
          
          <div className="absolute bottom-55 left-200 ">
            <Image
              src="/Error1.png"
              alt=""
              width={350}
              height={350}
            />
          </div>

          <div className="absolute bottom-10 left-110">
            <Image
              src="/Error2.png"
              alt=""
              width={220}
              height={220}
            />
          </div>
        
          <div className="absolute bottom-45 left-160">
            <Image
              src="/Error3.png"
              alt=""
              width={150}
              height={120}
            />
          </div>
      </section>

      {/* mobile */}
      <section className="md:hidden min-h-screen bg-white flex flex-col items-center px-6 pt-10 pb-24">
        
        
        <div className="h-6" />
        <img
          src="/Error4.png"
          className="w-full max-w-xs my-10"
        />

        <p className="text-center text-gray-600 text-sm leading-relaxed">
          Something went wrong, the page you’re looking for is not found.
        </p>

        <button onClick={() => router.back()}
          className="mt-8 bg-blue-700 text-white px-8 py-4 rounded-full font-medium">
            Back to Previous Page
        </button>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
          <div className="flex justify-around items-center h-16">
            
            <Link href="/student" className="flex flex-col items-center text-blue-600">
              <AiFillHome size={22} />
              <span className="text-xs mt-1">Home</span>
            </Link>

            <Link href="/student/explore" className="flex flex-col items-center text-gray-400">
              <AiOutlineCompass size={22} />
              <span className="text-xs mt-1">Explore</span>
            </Link>

            <Link href="/student/wishlist" className="flex flex-col items-center text-gray-400">
              <AiOutlineHeart size={22} />
              <span className="text-xs mt-1">Wishlist</span>
            </Link>

            <Link href="/student/profile" className="flex flex-col items-center text-gray-400">
              <AiOutlineUser size={22} />
              <span className="text-xs mt-1">Profile</span>
            </Link>

          </div>
        </nav>
      </section>
    </>
  );
};

export default Error404;

