import {Greeter} from '../src/index'
test('greeter', () => {
  const greet = Greeter('elisha');
  
  expect(greet).toBe('Hello elisha');
});