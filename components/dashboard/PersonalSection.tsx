'use client';

import { useState } from 'react';
import { Plus, Trash2, Trophy, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import type { PersonalFact, Achievement } from '@/types';

interface PersonalSectionProps {
  facts: PersonalFact[];
  achievements: Achievement[];
  userId: string;
}

export function PersonalSection({ facts: initialFacts, achievements: initialAchievements, userId: _userId }: PersonalSectionProps) {
  const [facts, setFacts] = useState(initialFacts);
  const [achievements, setAchievements] = useState(initialAchievements);
  const [newFactType, setNewFactType] = useState('');
  const [newFactContent, setNewFactContent] = useState('');
  const [newAchTitle, setNewAchTitle] = useState('');
  const [addingFact, setAddingFact] = useState(false);
  const [addingAch, setAddingAch] = useState(false);

  async function addFact() {
    if (!newFactType || !newFactContent) return;
    const res = await fetch('/api/personal-facts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ factType: newFactType, content: newFactContent }),
    });
    if (res.ok) {
      const data = await res.json();
      setFacts([...facts, data as PersonalFact]);
      setNewFactType('');
      setNewFactContent('');
      setAddingFact(false);
    }
  }

  async function deleteFact(id: string) {
    await fetch(`/api/personal-facts/${id}`, { method: 'DELETE' });
    setFacts(facts.filter((f) => f.id !== id));
  }

  async function addAchievement() {
    if (!newAchTitle) return;
    const res = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newAchTitle }),
    });
    if (res.ok) {
      const data = await res.json();
      setAchievements([data as Achievement, ...achievements]);
      setNewAchTitle('');
      setAddingAch(false);
      toast.success('Achievement logged!');
    }
  }

  async function deleteAchievement(id: string) {
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
    setAchievements(achievements.filter((a) => a.id !== id));
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">About Me</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Facts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {facts.map((fact) => (
              <div key={fact.id} className="flex items-start gap-2 group">
                <div className="flex-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase">{fact.factType ?? fact.fact_type}: </span>
                  <span className="text-sm">{fact.content}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => deleteFact(fact.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {addingFact ? (
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder="Type (e.g. Age, City, Mission)"
                  value={newFactType}
                  onChange={(e) => setNewFactType(e.target.value)}
                  className="h-8 text-sm"
                />
                <Input
                  placeholder="Value"
                  value={newFactContent}
                  onChange={(e) => setNewFactContent(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addFact()}
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setAddingFact(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={addFact}>Save</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => setAddingFact(true)}>
                <Plus className="h-3 w-3 mr-1" /> Add Fact
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" /> Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {achievements.map((ach) => (
              <div key={ach.id} className="flex items-start gap-2 group">
                <span className="text-base shrink-0">🏆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{ach.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(String(ach.date))}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 shrink-0"
                  onClick={() => deleteAchievement(ach.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {addingAch ? (
              <div className="space-y-2 pt-2 border-t">
                <Input
                  placeholder="Achievement title…"
                  value={newAchTitle}
                  onChange={(e) => setNewAchTitle(e.target.value)}
                  className="h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addAchievement()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 h-7 text-xs" onClick={() => setAddingAch(false)}>Cancel</Button>
                  <Button size="sm" className="flex-1 h-7 text-xs" onClick={addAchievement}>Log It</Button>
                </div>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => setAddingAch(true)}>
                <Plus className="h-3 w-3 mr-1" /> Log Achievement
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
