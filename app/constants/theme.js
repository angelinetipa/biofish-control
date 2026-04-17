import { StyleSheet } from 'react-native';
import { Colors } from './colors';

export const Theme = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.88)',
    shadowColor: '#fff',
    shadowOffset: { width: -6, height: -6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textMid,
    letterSpacing: 0.8,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfCard: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.white,
    letterSpacing: 0.5,
  },
  sectionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
});