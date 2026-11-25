import { lazy, Suspense, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ApiState from './ApiState'
import { NODE_STYLE } from '../three/nodeStyle'

// Le graphe 3D (et son moteur physique d3) n'est téléchargé qu'au besoin
const SkillGraph = lazy(() => import('../three/SkillGraph'))
import { CANDIDAT_SLUG } from '../config'
import { nodeLabel } from '../content/domaines'

const slugOf = (id) => id?.split(':')[1]

function Niveau({ value }) {
  return (
    <span className="niveau" aria-label={`Niveau ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={i <= value ? 'on' : ''} />
      ))}
      <b>{value}/5</b>
    </span>
  )
}

// Fiche du nœud sélectionné / survolé
function Fiche({ id, graph, candidat, stats, onSelect }) {
  const node = graph.nodes.find((n) => n.id === id)
  const voisins = (type) =>
    graph.links
      .filter((l) => l.source === id || l.target === id)
      .map((l) => (l.source === id ? l.target : l.source))
      .map((nid) => graph.nodes.find((n) => n.id === nid))
      .filter((n) => n?.type === type)

  if (!node) {
    return (
      <div className="fiche fiche--empty">
        <p className="fiche__kicker">Mode d'emploi</p>
        <ul>
          <li>Fais glisser pour tourner autour de la constellation.</li>
          <li>Survole un astre pour voir ses connexions.</li>
          <li>Clique pour épingler sa fiche ici.</li>
        </ul>
      </div>
    )
  }

  const color = NODE_STYLE[node.type]?.color
  const competence = candidat?.competences?.find((c) => c.skill_slug === slugOf(id))
  const stat = stats?.statistiques?.find((s) => s.competence_slug === slugOf(id))

  return (
    <div className="fiche" style={{ '--c': color }}>
      <p className="fiche__kicker">{NODE_STYLE[node.type]?.label.replace(/s$/, '')}</p>
      <h3 className="fiche__title">{nodeLabel(node)}</h3>

      {node.type === 'Competence' && (
        <>
          {competence && <Niveau value={competence.niveau} />}
          <p className="fiche__line">
            {stat ? `Utilisée dans ${stat.nombre_projets} projet${stat.nombre_projets > 1 ? 's' : ''}` : 'Pas encore utilisée dans un projet'}
          </p>
          <FicheList titre="Domaine" items={voisins('Domaine')} onSelect={onSelect} />
          <FicheList titre="Projets" items={voisins('Projet')} onSelect={onSelect} projet />
        </>
      )}
      {node.type === 'Projet' && (
        <>
          <FicheList titre="Compétences utilisées" items={voisins('Competence')} onSelect={onSelect} />
          <Link to={`/projets/${slugOf(id)}`} className="btn btn--primary fiche__cta">
            Explorer le projet →
          </Link>
        </>
      )}
      {node.type === 'Domaine' && (
        <FicheList titre="Compétences rattachées" items={voisins('Competence')} onSelect={onSelect} />
      )}
      {node.type === 'Candidat' && (
        <p className="fiche__line">
          {voisins('Projet').length} projets réalisés · {voisins('Competence').length} compétences maîtrisées
        </p>
      )}
    </div>
  )
}

function FicheList({ titre, items, onSelect, projet }) {
  if (!items.length) return null
  return (
    <div className="fiche__group">
      <p className="fiche__sub">{titre}</p>
      <ul className="chips">
        {items.map((n) => (
          <li key={n.id}>
            <button type="button" onClick={() => onSelect(n.id)} className={projet ? 'is-projet' : ''}>
              {nodeLabel(n)}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Alternative accessible au graphe 3D : les mêmes astres, utilisables au clavier et au lecteur d'écran
function GraphList({ graph, selected, onSelect }) {
  const types = ['Domaine', 'Projet', 'Competence']
  return (
    <details className="graph-list">
      <summary>Explorer la constellation sous forme de liste</summary>
      {types.map((type) => {
        const nodes = graph.nodes.filter((n) => n.type === type).sort((a, b) => nodeLabel(a).localeCompare(nodeLabel(b)))
        if (!nodes.length) return null
        return (
          <div key={type} className="graph-list__group" style={{ '--c': NODE_STYLE[type].color }}>
            <p className="fiche__sub">
              {NODE_STYLE[type].label} ({nodes.length})
            </p>
            <ul className="chips">
              {nodes.map((n) => (
                <li key={n.id}>
                  <button type="button" aria-pressed={selected === n.id} onClick={() => onSelect(selected === n.id ? null : n.id)}>
                    {nodeLabel(n)}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </details>
  )
}

// R3 — nombre de projets par compétence (agrégation MongoDB)
function Stats({ stats, selected, onSelect }) {
  const [table, setTable] = useState(false)
  const [tip, setTip] = useState(null)
  const rows = useMemo(
    () => [...stats.statistiques].sort((a, b) => b.nombre_projets - a.nombre_projets || a.nom.localeCompare(b.nom)),
    [stats],
  )
  const max = Math.max(1, ...rows.map((r) => r.nombre_projets))
  const top = rows[0]

  return (
    <div className="stats">
      <div className="stats__tiles">
        <div className="tile">
          <span>Projets analysés</span>
          <b>{stats.total_projets}</b>
        </div>
        <div className="tile">
          <span>Compétences utilisées</span>
          <b>{stats.total_competences_utilisees}</b>
        </div>
        {top && (
          <div className="tile tile--wide">
            <span>Compétence la plus utilisée</span>
            <b>{top.nom}</b>
            <small>
              {top.nombre_projets} projet{top.nombre_projets > 1 ? 's' : ''} sur {stats.total_projets}
            </small>
          </div>
        )}
      </div>

      <div className="stats__head">
        <h3>Nombre de projets par compétence</h3>
        <button type="button" className="filter" onClick={() => setTable((t) => !t)}>
          {table ? 'Vue graphique' : 'Vue tableau'}
        </button>
      </div>

      {table ? (
        <table className="stats__table">
          <thead>
            <tr>
              <th>Compétence</th>
              <th>Projets</th>
              <th>Part</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.competence_slug}>
                <td>{r.nom}</td>
                <td>{r.nombre_projets}</td>
                <td>{Math.round((r.nombre_projets / stats.total_projets) * 100)} %</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <ul className="bars" onMouseLeave={() => setTip(null)}>
          {rows.map((r, i) => {
            const id = `competence:${r.competence_slug}`
            return (
              <li key={r.competence_slug}>
                <button
                  type="button"
                  className={`bar ${selected === id ? 'is-selected' : ''}`}
                  onClick={() => onSelect(selected === id ? null : id)}
                  onMouseEnter={() => setTip(r.competence_slug)}
                  onFocus={() => setTip(r.competence_slug)}
                  style={{ '--w': r.nombre_projets / max, '--d': `${i * 40}ms` }}
                >
                  <span className="bar__name">{r.nom}</span>
                  <span className="bar__track">
                    <span className="bar__fill" />
                  </span>
                  <span className="bar__value">{r.nombre_projets}</span>
                  {tip === r.competence_slug && (
                    <span className="bar__tip" role="tooltip">
                      <b>{r.nom}</b> · {r.nombre_projets} projet{r.nombre_projets > 1 ? 's' : ''} sur{' '}
                      {stats.total_projets} ({Math.round((r.nombre_projets / stats.total_projets) * 100)} %)
                      <i>clique pour la repérer dans la constellation</i>
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Escale 02 — Compétences : R5 (graphe Neo4j) + R3 (statistiques MongoDB)
export default function Competences({ graph, stats, candidat }) {
  const [selected, setSelected] = useState(null)

  const niveaux = useMemo(
    () => Object.fromEntries((candidat.data?.competences ?? []).map((c) => [c.skill_slug, c.niveau])),
    [candidat.data],
  )

  return (
    <section id="competences" className="stop competences" style={{ '--c': 'var(--violet)' }}>
      <p className="eyebrow">Escale 02</p>
      <h2 className="stop__title">Compétences</h2>
      <p className="stop__lead">
        La constellation de Loïc : ses compétences, les domaines auxquels elles appartiennent et les projets qui
        les ont mises en œuvre.
      </p>

      <ApiState state={graph} route={`GET /api/graph/competences/${CANDIDAT_SLUG}`}>
        {(g) => (
          <div className="observatoire">
            <div className="observatoire__view">
              <Suspense fallback={<div className="graph graph--loading">Calcul de la constellation…</div>}>
                <SkillGraph graph={g} niveaux={niveaux} selected={selected} onSelect={setSelected} />
              </Suspense>
              <ul className="legend">
                {Object.entries(NODE_STYLE).map(([type, s]) => (
                  <li key={type} style={{ '--c': s.color }} className={`legend--${type}`}>
                    <i /> {s.label} <span>{g.nodes.filter((n) => n.type === type).length}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Fiche id={selected} graph={g} candidat={candidat.data} stats={stats.data} onSelect={setSelected} />
            <GraphList graph={g} selected={selected} onSelect={setSelected} />
          </div>
        )}
      </ApiState>

      <div className="stats-wrap">
        <ApiState state={stats} route={`GET /api/candidats/${CANDIDAT_SLUG}/stats`}>
          {(s) => <Stats stats={s} selected={selected} onSelect={setSelected} />}
        </ApiState>
      </div>
    </section>
  )
}
