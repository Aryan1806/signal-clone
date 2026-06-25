"""
Seed the database with realistic sample data.
Run: python seed.py
"""
import sys
import os
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(__file__))

from database import engine, SessionLocal, Base
import models  # noqa

from models.user import User
from models.contact import Contact
from models.conversation import Conversation, ConversationParticipant
from models.group import Group
from models.message import Message, MessageReceipt
from core.security import hash_password

Base.metadata.create_all(bind=engine)

db = SessionLocal()

# --- Clear existing data ---
db.query(MessageReceipt).delete()
db.query(Message).delete()
db.query(Group).delete()
db.query(ConversationParticipant).delete()
db.query(Conversation).delete()
db.query(Contact).delete()
db.query(User).delete()
db.commit()

# --- Create users ---
users_data = [
    {"phone": "+919876543210", "display_name": "Aryan Sharma", "password": "password123"},
    {"phone": "+919123456789", "display_name": "Priya Patel", "password": "password123"},
    {"phone": "+919234567890", "display_name": "Rahul Gupta", "password": "password123"},
    {"phone": "+919345678901", "display_name": "Sneha Reddy", "password": "password123"},
    {"phone": "+919456789012", "display_name": "Vikram Singh", "password": "password123"},
    {"phone": "+919567890123", "display_name": "Meera Nair", "password": "password123"},
    {"phone": "+919678901234", "display_name": "Karan Mehta", "password": "password123"},
    {"phone": "+919789012345", "display_name": "Ananya Iyer", "password": "password123"},
]

users = []
for ud in users_data:
    name_seed = ud["display_name"].replace(" ", "")
    user = User(
        phone=ud["phone"],
        display_name=ud["display_name"],
        password_hash=hash_password(ud["password"]),
        avatar_url=f"https://api.dicebear.com/7.x/avataaars/svg?seed={name_seed}",
        about=random.choice([
            "Hey there! I am using Signal.",
            "Available",
            "Busy",
            "At work",
            "In a meeting",
            "On a call",
        ]),
        is_online=False,
    )
    db.add(user)

db.commit()
users = db.query(User).all()
print(f"Created {len(users)} users")

# --- Create contacts (everyone knows everyone) ---
for i, u1 in enumerate(users):
    for u2 in users:
        if u1.id != u2.id:
            contact = Contact(owner_id=u1.id, contact_id=u2.id)
            db.add(contact)

db.commit()
print("Created contacts")


def make_time(days_ago=0, hours_ago=0, minutes_ago=0):
    return datetime.utcnow() - timedelta(days=days_ago, hours=hours_ago, minutes=minutes_ago)


def create_direct_conv(user1, user2):
    conv = Conversation(type="direct", updated_at=datetime.utcnow())
    db.add(conv)
    db.flush()
    p1 = ConversationParticipant(conversation_id=conv.id, user_id=user1.id, role="member")
    p2 = ConversationParticipant(conversation_id=conv.id, user_id=user2.id, role="member")
    db.add_all([p1, p2])
    db.flush()
    return conv, p1, p2


def add_message(conv_id, sender_id, content, created_at, msg_type="text", status="read"):
    msg = Message(
        conversation_id=conv_id,
        sender_id=sender_id,
        content=content,
        message_type=msg_type,
        status=status,
        created_at=created_at,
        updated_at=created_at,
    )
    db.add(msg)
    db.flush()
    return msg


# --- Direct conversation 1: Aryan ↔ Priya ---
aryan, priya, rahul, sneha, vikram, meera, karan, ananya = users

conv1, p1a, p1p = create_direct_conv(aryan, priya)

msgs1 = [
    (priya.id, "Hey Aryan! Did you check the new Signal update?", make_time(days_ago=3, hours_ago=2)),
    (aryan.id, "Not yet, what's new in it?", make_time(days_ago=3, hours_ago=1, minutes_ago=55)),
    (priya.id, "They added some cool privacy features. You should check it out!", make_time(days_ago=3, hours_ago=1, minutes_ago=50)),
    (aryan.id, "Nice! I'll update it today. Hey, are you free this weekend?", make_time(days_ago=3, hours_ago=1, minutes_ago=45)),
    (priya.id, "Sunday works for me. What's the plan?", make_time(days_ago=3, hours_ago=1, minutes_ago=40)),
    (aryan.id, "Let's go to that new cafe that opened near MG Road. I heard the coffee is amazing.", make_time(days_ago=3, hours_ago=1, minutes_ago=35)),
    (priya.id, "Sounds great! What time?", make_time(days_ago=3, hours_ago=1, minutes_ago=30)),
    (aryan.id, "Around 11 AM?", make_time(days_ago=3, hours_ago=1, minutes_ago=25)),
    (priya.id, "Perfect 👍", make_time(days_ago=3, hours_ago=1, minutes_ago=20)),
    (aryan.id, "See you then!", make_time(days_ago=3, hours_ago=1, minutes_ago=15)),
    (priya.id, "Can't wait! 😊", make_time(days_ago=2, hours_ago=5)),
    (aryan.id, "By the way, did you finish the project report?", make_time(days_ago=2, hours_ago=4, minutes_ago=50)),
    (priya.id, "Almost done. Just need to add the conclusion section.", make_time(days_ago=2, hours_ago=4, minutes_ago=45)),
    (aryan.id, "Same here. Let's review each other's work tomorrow?", make_time(days_ago=2, hours_ago=4, minutes_ago=40)),
    (priya.id, "Great idea! Send me yours when ready.", make_time(days_ago=2, hours_ago=4, minutes_ago=35)),
    (aryan.id, "Will do 👌", make_time(days_ago=1, hours_ago=3)),
    (priya.id, "Good morning! I sent you the report link on email.", make_time(days_ago=1, hours_ago=2, minutes_ago=30)),
    (aryan.id, "Got it, reading now. Looks really good Priya!", make_time(days_ago=1, hours_ago=2, minutes_ago=20)),
    (priya.id, "Thanks! Yours was excellent too. Very thorough analysis.", make_time(hours_ago=5)),
    (aryan.id, "We make a great team 😄", make_time(hours_ago=4, minutes_ago=55)),
]

last_msg1 = None
for sender_id, content, created_at in msgs1:
    last_msg1 = add_message(conv1.id, sender_id, content, created_at)

conv1.updated_at = msgs1[-1][2]
p1a.last_read_at = make_time(hours_ago=4, minutes_ago=50)
p1p.last_read_at = make_time(hours_ago=4, minutes_ago=50)

# --- Direct conversation 2: Aryan ↔ Rahul ---
conv2, p2a, p2r = create_direct_conv(aryan, rahul)

msgs2 = [
    (rahul.id, "Bro, did you watch the IPL match yesterday?", make_time(days_ago=5, hours_ago=3)),
    (aryan.id, "Of course! What a thriller that was! Last over magic 🏏", make_time(days_ago=5, hours_ago=2, minutes_ago=55)),
    (rahul.id, "That six in the last ball was insane! I literally jumped off my couch.", make_time(days_ago=5, hours_ago=2, minutes_ago=50)),
    (aryan.id, "Same here haha! Who do you think wins the final?", make_time(days_ago=5, hours_ago=2, minutes_ago=45)),
    (rahul.id, "Mumbai for sure. Their bowling lineup is too strong.", make_time(days_ago=5, hours_ago=2, minutes_ago=40)),
    (aryan.id, "I disagree, Chennai's batting is on another level this season.", make_time(days_ago=5, hours_ago=2, minutes_ago=35)),
    (rahul.id, "We'll see 😄 Wanna bet?", make_time(days_ago=5, hours_ago=2, minutes_ago=30)),
    (aryan.id, "You're on! Loser buys dinner.", make_time(days_ago=5, hours_ago=2, minutes_ago=25)),
    (rahul.id, "Deal! This is gonna be fun.", make_time(days_ago=4, hours_ago=6)),
    (aryan.id, "Hey, are you coming to the office tomorrow?", make_time(days_ago=4, hours_ago=5, minutes_ago=55)),
    (rahul.id, "Yes! Got a standup at 10. You?", make_time(days_ago=4, hours_ago=5, minutes_ago=50)),
    (aryan.id, "Yeah, let's grab lunch together.", make_time(days_ago=4, hours_ago=5, minutes_ago=45)),
    (rahul.id, "Sure! That new dhaba near the office?", make_time(days_ago=4, hours_ago=5, minutes_ago=40)),
    (aryan.id, "Perfect 🍛", make_time(days_ago=4, hours_ago=5, minutes_ago=35)),
    (rahul.id, "Hey I'm running 10 mins late today, already left home.", make_time(hours_ago=2)),
    (aryan.id, "No worries, I'll wait at the lobby.", make_time(hours_ago=1, minutes_ago=55)),
    (rahul.id, "Thanks man, almost there!", make_time(hours_ago=1, minutes_ago=30)),
]

for sender_id, content, created_at in msgs2:
    add_message(conv2.id, sender_id, content, created_at)

conv2.updated_at = msgs2[-1][2]
p2a.last_read_at = make_time(hours_ago=1, minutes_ago=25)
p2r.last_read_at = make_time(hours_ago=1, minutes_ago=25)

# --- Direct conversation 3: Aryan ↔ Sneha (unread for Aryan) ---
conv3, p3a, p3s = create_direct_conv(aryan, sneha)

msgs3 = [
    (aryan.id, "Hey Sneha, do you have the design files for the landing page?", make_time(days_ago=2, hours_ago=10)),
    (sneha.id, "Yes! Let me share them now.", make_time(days_ago=2, hours_ago=9, minutes_ago=55)),
    (aryan.id, "Thanks! The client meeting is tomorrow so I need them urgently.", make_time(days_ago=2, hours_ago=9, minutes_ago=50)),
    (sneha.id, "Sent! Check your email. I also included the mobile mockups.", make_time(days_ago=2, hours_ago=9, minutes_ago=45)),
    (aryan.id, "Got them! These look fantastic Sneha, great work!", make_time(days_ago=2, hours_ago=9, minutes_ago=40)),
    (sneha.id, "Thank you! Let me know if you need any changes.", make_time(days_ago=2, hours_ago=9, minutes_ago=35)),
    (sneha.id, "Hey, how did the client meeting go?", make_time(hours_ago=3)),
    (sneha.id, "They loved the designs! We got the project 🎉", make_time(hours_ago=2, minutes_ago=30)),
    (sneha.id, "Celebrating tonight, you should come!", make_time(hours_ago=1)),
]

for sender_id, content, created_at in msgs3:
    add_message(conv3.id, sender_id, content, created_at, status="delivered" if sender_id == sneha.id else "read")

conv3.updated_at = msgs3[-1][2]
p3a.last_read_at = make_time(days_ago=2, hours_ago=9, minutes_ago=30)  # Aryan hasn't seen the new ones
p3s.last_read_at = make_time(hours_ago=1)

# --- Direct conversation 4: Aryan ↔ Vikram (unread for Aryan) ---
conv4, p4a, p4v = create_direct_conv(aryan, vikram)

msgs4 = [
    (aryan.id, "Vikram, can you review the PR I raised today?", make_time(days_ago=1, hours_ago=8)),
    (vikram.id, "Sure, adding it to my queue.", make_time(days_ago=1, hours_ago=7, minutes_ago=55)),
    (aryan.id, "It's the auth module refactor, high priority.", make_time(days_ago=1, hours_ago=7, minutes_ago=50)),
    (vikram.id, "On it! Give me a couple of hours.", make_time(days_ago=1, hours_ago=7, minutes_ago=45)),
    (vikram.id, "Reviewed! Left some comments, mostly minor things.", make_time(days_ago=1, hours_ago=5)),
    (aryan.id, "Great, I'll address them now.", make_time(days_ago=1, hours_ago=4, minutes_ago=55)),
    (vikram.id, "LGTM after your changes! Merging it now.", make_time(days_ago=1, hours_ago=2)),
    (aryan.id, "Thanks! Pipeline is green 🟢", make_time(days_ago=1, hours_ago=1, minutes_ago=55)),
    (vikram.id, "Hey, quick question about the new feature spec", make_time(minutes_ago=45)),
    (vikram.id, "Should the user be able to delete their account permanently?", make_time(minutes_ago=40)),
    (vikram.id, "Or just soft delete?", make_time(minutes_ago=38)),
]

for sender_id, content, created_at in msgs4:
    add_message(conv4.id, sender_id, content, created_at, status="delivered" if sender_id == vikram.id else "read")

conv4.updated_at = msgs4[-1][2]
p4a.last_read_at = make_time(days_ago=1, hours_ago=1, minutes_ago=50)  # Aryan hasn't seen Vikram's latest messages
p4v.last_read_at = make_time(minutes_ago=35)

# --- Direct conversation 5: Priya ↔ Rahul ---
conv5, p5p, p5r = create_direct_conv(priya, rahul)

msgs5 = [
    (priya.id, "Rahul, are you coming to the team lunch tomorrow?", make_time(days_ago=1, hours_ago=4)),
    (rahul.id, "Yes! What time and where?", make_time(days_ago=1, hours_ago=3, minutes_ago=55)),
    (priya.id, "1 PM at Barbeque Nation. It's the manager's treat!", make_time(days_ago=1, hours_ago=3, minutes_ago=50)),
    (rahul.id, "Oh wow, nice! I'll definitely be there.", make_time(days_ago=1, hours_ago=3, minutes_ago=45)),
    (priya.id, "Don't be late like last time 😅", make_time(days_ago=1, hours_ago=3, minutes_ago=40)),
    (rahul.id, "That was ONE time! I had a client call.", make_time(days_ago=1, hours_ago=3, minutes_ago=35)),
    (priya.id, "Sure sure 😄 See you tomorrow!", make_time(days_ago=1, hours_ago=3, minutes_ago=30)),
]

for sender_id, content, created_at in msgs5:
    add_message(conv5.id, sender_id, content, created_at)

conv5.updated_at = msgs5[-1][2]
p5p.last_read_at = make_time(days_ago=1, hours_ago=3, minutes_ago=25)
p5r.last_read_at = make_time(days_ago=1, hours_ago=3, minutes_ago=25)

db.commit()
print("Created direct conversations")

# --- Group conversation 1: Dev Team ---
group_conv1 = Conversation(type="group", updated_at=datetime.utcnow())
db.add(group_conv1)
db.flush()

group_members1 = [aryan, priya, rahul, sneha, vikram]
for i, u in enumerate(group_members1):
    role = "admin" if i == 0 else "member"
    p = ConversationParticipant(conversation_id=group_conv1.id, user_id=u.id, role=role)
    db.add(p)

group1 = Group(
    conversation_id=group_conv1.id,
    name="Dev Team 🚀",
    description="All things engineering",
    avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=DevTeam&backgroundColor=3a76f0",
    created_by=aryan.id,
)
db.add(group1)
db.flush()

group_msgs1 = [
    (aryan.id, "Dev Team 🚀 created this group", make_time(days_ago=10), "system"),
    (aryan.id, "Welcome everyone to the Dev Team group! This is our official chat for project updates.", make_time(days_ago=10, hours_ago=-1)),
    (priya.id, "Hi team! Excited to be here 👋", make_time(days_ago=9, hours_ago=8)),
    (rahul.id, "Hey everyone! Let's build something amazing.", make_time(days_ago=9, hours_ago=7, minutes_ago=55)),
    (sneha.id, "Hello! I'll be sharing design updates here.", make_time(days_ago=9, hours_ago=7, minutes_ago=50)),
    (vikram.id, "Great, I'll post code review reminders here too.", make_time(days_ago=9, hours_ago=7, minutes_ago=45)),
    (aryan.id, "Sprint 1 planning is tomorrow at 10 AM. Everyone please review the Jira board.", make_time(days_ago=8, hours_ago=6)),
    (priya.id, "Done! I've added my tasks. The API integration work looks feasible.", make_time(days_ago=8, hours_ago=5, minutes_ago=55)),
    (rahul.id, "Same, assigned myself the DB schema tasks.", make_time(days_ago=8, hours_ago=5, minutes_ago=50)),
    (sneha.id, "Design tickets are ready. I can start on mockups today.", make_time(days_ago=8, hours_ago=5, minutes_ago=45)),
    (vikram.id, "I'll tackle the CI/CD setup first, it unblocks everyone.", make_time(days_ago=8, hours_ago=5, minutes_ago=40)),
    (aryan.id, "Perfect plan team! Let's crush it this sprint 💪", make_time(days_ago=8, hours_ago=5, minutes_ago=35)),
    (priya.id, "Quick update: Auth endpoints are done and tested.", make_time(days_ago=6, hours_ago=4)),
    (rahul.id, "DB schema is finalized and migrations are running clean.", make_time(days_ago=6, hours_ago=3, minutes_ago=55)),
    (sneha.id, "Sharing initial mockups in the design channel. Take a look!", make_time(days_ago=6, hours_ago=3, minutes_ago=50)),
    (vikram.id, "CI pipeline is live! Every PR now runs tests automatically.", make_time(days_ago=6, hours_ago=3, minutes_ago=45)),
    (aryan.id, "This team is fire 🔥 Sprint 1 looking great!", make_time(days_ago=6, hours_ago=3, minutes_ago=40)),
    (priya.id, "Anyone free for a quick call to discuss the WebSocket implementation?", make_time(days_ago=4, hours_ago=2)),
    (rahul.id, "I'm free after 3 PM", make_time(days_ago=4, hours_ago=1, minutes_ago=55)),
    (sneha.id, "Same, 3 PM works.", make_time(days_ago=4, hours_ago=1, minutes_ago=50)),
    (vikram.id, "I'll join too, I have experience with WebSockets.", make_time(days_ago=4, hours_ago=1, minutes_ago=45)),
    (aryan.id, "Call set for 3 PM then! Sending invite now.", make_time(days_ago=4, hours_ago=1, minutes_ago=40)),
    (aryan.id, "Great call everyone! Here's the summary: using FastAPI WebSockets, JWT auth on connect, ConnectionManager pattern.", make_time(days_ago=4, hours_ago=-2)),
    (priya.id, "Saved the notes. Let's start implementation tomorrow.", make_time(days_ago=3, hours_ago=6)),
    (rahul.id, "Reminder: code freeze is next Friday!", make_time(days_ago=1, hours_ago=3)),
    (sneha.id, "All designs approved by client ✅", make_time(hours_ago=6)),
    (vikram.id, "All tests passing, coverage at 87%! 🎉", make_time(hours_ago=5)),
    (aryan.id, "Amazing work everyone! We're ahead of schedule.", make_time(hours_ago=4, minutes_ago=30)),
    (priya.id, "Can't believe how well this sprint went 😄", make_time(hours_ago=2)),
    (rahul.id, "Team celebration on Friday?", make_time(hours_ago=1, minutes_ago=30)),
    (sneha.id, "Yes!! I know a great place.", make_time(hours_ago=1)),
    (vikram.id, "Count me in 🎊", make_time(minutes_ago=30)),
]

for sender_id, content, created_at, *rest in group_msgs1:
    msg_type = rest[0] if rest else "text"
    add_message(group_conv1.id, sender_id, content, created_at, msg_type=msg_type)

group_conv1.updated_at = group_msgs1[-1][2]

for u in group_members1:
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == group_conv1.id,
        ConversationParticipant.user_id == u.id
    ).first()
    if part:
        if u.id == aryan.id:
            part.last_read_at = make_time(hours_ago=4, minutes_ago=25)
        else:
            part.last_read_at = make_time(minutes_ago=25)

# --- Group conversation 2: Friends ---
group_conv2 = Conversation(type="group", updated_at=datetime.utcnow())
db.add(group_conv2)
db.flush()

group_members2 = [aryan, meera, karan, ananya, priya]
for i, u in enumerate(group_members2):
    role = "admin" if i == 0 else "member"
    p = ConversationParticipant(conversation_id=group_conv2.id, user_id=u.id, role=role)
    db.add(p)

group2 = Group(
    conversation_id=group_conv2.id,
    name="College Buddies 🎓",
    description="Forever friends from Computer Science Batch 2020",
    avatar_url="https://api.dicebear.com/7.x/initials/svg?seed=CollegeBuddies&backgroundColor=34c759",
    created_by=aryan.id,
)
db.add(group2)
db.flush()

group_msgs2 = [
    (aryan.id, "College Buddies 🎓 created this group", make_time(days_ago=15), "system"),
    (aryan.id, "Reuniting the CS batch 2020 gang here! 🎉", make_time(days_ago=15, hours_ago=-1)),
    (meera.id, "Oh wow this brings back memories!! Hi everyone 😭", make_time(days_ago=14, hours_ago=5)),
    (karan.id, "Bro it's been so long! How is everyone?", make_time(days_ago=14, hours_ago=4, minutes_ago=55)),
    (ananya.id, "I literally got teary eyed seeing this group 😂 Miss you all so much!", make_time(days_ago=14, hours_ago=4, minutes_ago=50)),
    (priya.id, "Haha same! We should plan a reunion!", make_time(days_ago=14, hours_ago=4, minutes_ago=45)),
    (aryan.id, "Yes! Where is everyone right now?", make_time(days_ago=14, hours_ago=4, minutes_ago=40)),
    (meera.id, "I'm in Bangalore, working at a startup.", make_time(days_ago=14, hours_ago=4, minutes_ago=35)),
    (karan.id, "Mumbai here, fintech space.", make_time(days_ago=14, hours_ago=4, minutes_ago=30)),
    (ananya.id, "Hyderabad! Product manager at a big tech.", make_time(days_ago=14, hours_ago=4, minutes_ago=25)),
    (priya.id, "Bangalore too! We should grab coffee Meera!!", make_time(days_ago=14, hours_ago=4, minutes_ago=20)),
    (meera.id, "YES PRIYA OMG!! DM me 😄", make_time(days_ago=14, hours_ago=4, minutes_ago=15)),
    (aryan.id, "Okay so Bangalore reunion it is? Karan and Ananya fly in!", make_time(days_ago=12, hours_ago=6)),
    (karan.id, "I'm game! Long weekend in August?", make_time(days_ago=12, hours_ago=5, minutes_ago=55)),
    (ananya.id, "August works for me! Let's make it happen.", make_time(days_ago=12, hours_ago=5, minutes_ago=50)),
    (meera.id, "I'll start looking at AirBnb options.", make_time(days_ago=12, hours_ago=5, minutes_ago=45)),
    (priya.id, "I know a great area to stay. Send me the dates!", make_time(days_ago=12, hours_ago=5, minutes_ago=40)),
    (karan.id, "Hey did anyone hear about Professor Kumar? He got an award!", make_time(days_ago=7, hours_ago=3)),
    (ananya.id, "Whoa!! For which paper?", make_time(days_ago=7, hours_ago=2, minutes_ago=55)),
    (karan.id, "Machine learning in healthcare. He was always brilliant.", make_time(days_ago=7, hours_ago=2, minutes_ago=50)),
    (aryan.id, "That's amazing! We should send him a congratulations message.", make_time(days_ago=7, hours_ago=2, minutes_ago=45)),
    (meera.id, "Great idea! Anyone have his email?", make_time(days_ago=7, hours_ago=2, minutes_ago=40)),
    (priya.id, "I have it! I'll draft something tonight.", make_time(days_ago=7, hours_ago=2, minutes_ago=35)),
    (ananya.id, "This trip is going to be legendary. I'm already so excited!!", make_time(days_ago=3, hours_ago=4)),
    (karan.id, "Booked my flights! Arriving Friday evening.", make_time(hours_ago=8)),
    (ananya.id, "Me too! Let's plan the itinerary.", make_time(hours_ago=7, minutes_ago=30)),
    (meera.id, "Already made a list: Cubbon Park, food street, UB City...", make_time(hours_ago=7)),
    (priya.id, "Adding Toit brewery and Matteo Coffea to that list 😍", make_time(hours_ago=6, minutes_ago=30)),
    (aryan.id, "This is going to be the best trip! Can't wait to see you all.", make_time(hours_ago=1)),
]

for sender_id, content, created_at, *rest in group_msgs2:
    msg_type = rest[0] if rest else "text"
    add_message(group_conv2.id, sender_id, content, created_at, msg_type=msg_type)

group_conv2.updated_at = group_msgs2[-1][2]

for u in group_members2:
    part = db.query(ConversationParticipant).filter(
        ConversationParticipant.conversation_id == group_conv2.id,
        ConversationParticipant.user_id == u.id
    ).first()
    if part:
        if u.id == aryan.id:
            part.last_read_at = make_time(hours_ago=1, minutes_ago=5)
        else:
            part.last_read_at = make_time(minutes_ago=30)

db.commit()
db.close()

print("Database seeded successfully!")
print("\nSeed accounts (phone / password):")
for ud in users_data:
    print(f"  {ud['phone']} / {ud['password']}")
print("\nPrimary test account: +919876543210 / password123")
