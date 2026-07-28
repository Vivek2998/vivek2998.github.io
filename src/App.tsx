import { Aurora } from './components/Aurora'
import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { About } from './components/About'
import { Work } from './components/Work'
import { Rebuild } from './components/Rebuild'
import { Journey } from './components/Journey'
import { Skills } from './components/Skills'
import { Contact, Footer } from './components/Contact'

export default function App() {
  return (
    <>
      <Aurora />
      <Nav />
      <main>
        <Hero />
        <About />
        <Work />
        <Rebuild />
        <Journey />
        <Skills />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
