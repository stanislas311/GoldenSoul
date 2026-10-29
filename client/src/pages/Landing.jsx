import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Calendar, Video, ArrowRight, UserPlus, Clock, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import AnimatedBackground from '../components/AnimatedBackground';

function Landing() {
  const { t } = useTranslation();
  return (
    <div className="relative min-h-screen bg-ink text-ivory overflow-hidden">
      <AnimatedBackground />
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-32 px-6 max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-gold font-medium tracking-wide uppercase text-sm mb-4">
            {t('landing.badge')}
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-tight mb-6">
            {t('landing.titre1')} <span className="text-gold">{t('landing.titreAccent')}</span>{t('landing.titre2')}
          </h1>
          <p className="text-ivory/70 text-xl mb-10 max-w-lg leading-relaxed">
            {t('landing.sousTitre')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gold text-ink rounded-full font-semibold hover:bg-gold/90 transition-all hover:scale-105"
            >
              {t('landing.bouton')} <ArrowRight size={20} />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border border-ivory/30 rounded-full font-semibold hover:bg-ivory/10 transition-all"
            >
              {t('landing.boutonConnexion')}
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent rounded-3xl blur-3xl" />
            <img
              src="https://i.pinimg.com/1200x/72/82/da/7282da2f7af6b051a007a4885ec0d9e2.jpg"
              alt="Séance d'accompagnement sereine"
              className="relative rounded-3xl object-cover w-full h-[550px] shadow-2xl shadow-black/40"
            />
          </div>
        </motion.div>
      </section>

      {/* Comment ça marche */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-gold font-medium tracking-wide uppercase text-sm mb-4">
            {t('landing.simpleRapide')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">{t('landing.commentCaMarche')}</h2>
          <p className="text-ivory/60 text-lg max-w-2xl mx-auto">
            {t('landing.commentCaMarcheSousTitre')}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: UserPlus,
              titre: t('landing.etape1Titre'),
              texte: t('landing.etape1Texte'),
              numero: "01"
            },
            {
              icon: Calendar,
              titre: t('landing.etape2Titre'),
              texte: t('landing.etape2Texte'),
              numero: "02"
            },
            {
              icon: Video,
              titre: t('landing.etape3Titre'),
              texte: t('landing.etape3Texte'),
              numero: "03"
            },
          ].map((item, index) => (
            <motion.div
              key={item.titre}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative bg-jade/30 border border-ivory/10 rounded-3xl p-8 hover:border-gold/30 transition-all hover:scale-105"
            >
              <div className="absolute -top-4 -left-4 w-12 h-12 bg-gold rounded-full flex items-center justify-center text-ink font-bold text-lg">
                {item.numero}
              </div>
              <div className="mt-4 mb-6">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-4">
                  <item.icon className="text-gold" size={32} />
                </div>
              </div>
              <h3 className="font-display text-2xl mb-3">{item.titre}</h3>
              <p className="text-ivory/60 leading-relaxed">{item.texte}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bénéfices */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-gold font-medium tracking-wide uppercase text-sm mb-4">
            {t('landing.pourquoiNous')}
          </p>
          <h2 className="font-display text-4xl md:text-5xl mb-4">{t('landing.vosAvantages')}</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Calendar,
              titre: t('landing.beneficeReservationTitre'),
              texte: t('landing.beneficeReservationTexte'),
            },
            {
              icon: Video,
              titre: t('landing.beneficeSeanceTitre'),
              texte: t('landing.beneficeSeanceTexte'),
            },
            {
              icon: ShieldCheck,
              titre: t('landing.beneficeDonneesTitre'),
              texte: t('landing.beneficeDonneesTexte'),
            },
          ].map((item, index) => (
            <motion.div
              key={item.titre}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="bg-jade/30 border border-ivory/10 rounded-2xl p-8 hover:border-gold/40 transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold/20 transition-colors">
                <item.icon className="text-gold" size={32} />
              </div>
              <h3 className="font-display text-2xl mb-3">{item.titre}</h3>
              <p className="text-ivory/60 leading-relaxed">{item.texte}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative border border-gold/30 rounded-3xl p-12 md:p-16 overflow-hidden"
        >
          {/* Collage d'images en arrière-plan - grille simple */}
          <div className="absolute inset-0 grid grid-cols-2 md:grid-cols-3 grid-rows-2 gap-2 p-2">
            {[
              'https://images.unsplash.com/photo-1544027993-37dbfe43562a?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1588196749597-9ff075ee6b5b?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=400&fit=crop',
              'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=400&h=400&fit=crop'
            ].map((src, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 1.05 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.08 }}
                className="relative overflow-hidden rounded-2xl"
              >
                <img
                  src={src}
                  alt={`Thérapie ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-ink/50" />
              </motion.div>
            ))}
          </div>


          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h2 className="font-display text-4xl md:text-5xl mb-6">
              {t('landing.ctaTitre')}
            </h2>
            <p className="text-ivory/70 text-xl mb-10 leading-relaxed font-semibold">
              {t('landing.ctaTexte')}
            </p>
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-5 bg-gold text-ink rounded-full font-semibold text-lg hover:bg-gold/90 transition-all hover:scale-105 shadow-lg shadow-gold/30"
            >
              {t('landing.ctaBouton')} <ArrowRight size={24} />
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

export default Landing;
